/**
 * Sync Daemon — runs on the on-prem server
 * Pushes records with synced=false to Supabase Cloud when internet is available.
 * Runs every SYNC_INTERVAL seconds (default: 300 = 5 minutes).
 *
 * Architecture:
 *   On-prem PostgreSQL  →  this daemon  →  Supabase Cloud
 *   (primary, always)                      (replica, when online)
 *
 * The daemon:
 *   1. Checks if internet is reachable (ping Supabase URL)
 *   2. If reachable, finds all rows where synced=false
 *   3. Upserts them to Supabase (idempotent — safe to retry)
 *   4. Marks rows as synced=true in local DB
 *   5. Also pulls any changes from Supabase newer than last_pulled_at
 *      (for multi-site sync, e.g. remote sales team entering data)
 */

const { createClient } = require("@supabase/supabase-js");
const pool = require("../db/pool");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const INTERVAL_MS  = (parseInt(process.env.SYNC_INTERVAL) || 300) * 1000;

// Tables to sync — order matters (respect FK dependencies)
const SYNC_TABLES = [
  "users", "customers", "vendors", "products", "bank_accounts",
  "accounts", "employees", "fixed_assets",
  "purchase_orders", "po_lines",
  "sales_orders", "so_lines",
  "ar_invoices", "ap_invoices",
  "journal_entries", "journal_lines",
];

// State tracking
const state = {
  lastSyncAt:  null,
  lastPullAt:  null,
  pushCount:   0,
  pullCount:   0,
  errors:      0,
};

function log(msg, level = "info") {
  const ts = new Date().toISOString();
  const prefix = level === "error" ? "❌" : level === "warn" ? "⚠️" : "✅";
  console.log(`[${ts}] ${prefix} SYNC: ${msg}`);
}

async function isOnline() {
  if (!SUPABASE_URL) return false;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { signal: ctrl.signal });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function pushToSupabase(supabase) {
  let total = 0;
  for (const table of SYNC_TABLES) {
    try {
      // Check if table exists locally with synced column
      const check = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name='synced'`,
        [table]
      );
      if (!check.rows.length) continue;

      // Get unsynced rows
      const { rows } = await pool.query(
        `SELECT * FROM ${table} WHERE synced = false LIMIT 500`
      );
      if (!rows.length) continue;

      // Strip the synced column before sending to Supabase
      const records = rows.map(({ synced, ...r }) => r);

      // Upsert to Supabase (idempotent)
      const { error } = await supabase.from(table).upsert(records, {
        onConflict: "id",
        ignoreDuplicates: false,
      });

      if (error) {
        log(`Push ${table}: ${error.message}`, "error");
        state.errors++;
        continue;
      }

      // Mark as synced in local DB
      const ids = rows.map(r => r.id);
      await pool.query(
        `UPDATE ${table} SET synced = true WHERE id = ANY($1)`,
        [ids]
      );

      log(`Pushed ${rows.length} rows from ${table}`);
      total += rows.length;
    } catch (e) {
      log(`Push ${table} failed: ${e.message}`, "error");
      state.errors++;
    }
  }
  return total;
}

async function pullFromSupabase(supabase) {
  // Pull records updated in cloud since last pull
  // (useful for multi-site: e.g. Supabase has records entered via Vercel/remote)
  let total = 0;
  const since = state.lastPullAt?.toISOString() || new Date(0).toISOString();

  for (const table of SYNC_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .gt("updated_at", since)
        .limit(500);

      if (error || !data?.length) continue;

      for (const row of data) {
        // Check if row exists locally
        const { rows: existing } = await pool.query(
          `SELECT id, updated_at FROM ${table} WHERE id = $1`, [row.id]
        );

        if (!existing.length) {
          // Insert new row from cloud
          const keys = Object.keys(row).filter(k => k !== "synced");
          const vals = keys.map(k => row[k]);
          const cols = keys.join(", ");
          const phs  = keys.map((_, i) => `$${i+1}`).join(", ");
          await pool.query(
            `INSERT INTO ${table} (${cols}, synced) VALUES (${phs}, true) ON CONFLICT (id) DO NOTHING`,
            vals
          ).catch(() => {}); // ignore PK conflicts
        } else {
          const localUpdated = new Date(existing[0].updated_at);
          const cloudUpdated = new Date(row.updated_at);
          // Cloud wins if it's newer (last-write-wins)
          if (cloudUpdated > localUpdated) {
            const keys = Object.keys(row).filter(k => k !== "id" && k !== "synced");
            const vals = keys.map(k => row[k]);
            const sets = keys.map((k, i) => `${k} = $${i+1}`).join(", ");
            await pool.query(
              `UPDATE ${table} SET ${sets}, synced = true WHERE id = $${keys.length+1}`,
              [...vals, row.id]
            ).catch(() => {});
          }
        }
        total++;
      }
      if (total > 0) log(`Pulled ${data.length} rows from ${table}`);
    } catch (e) {
      log(`Pull ${table} failed: ${e.message}`, "warn");
    }
  }
  return total;
}

async function syncCycle() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log("Supabase credentials not configured — sync disabled", "warn");
    return;
  }

  const online = await isOnline();
  if (!online) {
    log("Offline — sync skipped");
    return;
  }

  log("Online — starting sync cycle");
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const pushed = await pushToSupabase(supabase);
  const pulled = await pullFromSupabase(supabase);

  state.lastSyncAt = new Date();
  state.lastPullAt = new Date();
  state.pushCount += pushed;
  state.pullCount  += pulled;

  if (pushed + pulled === 0) {
    log("Nothing to sync — all up to date");
  } else {
    log(`Cycle complete: pushed ${pushed}, pulled ${pulled} rows`);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────
(async () => {
  log(`Sync daemon starting (interval: ${INTERVAL_MS/1000}s)`);
  log(`Target: ${SUPABASE_URL || "NOT SET"}`);

  // Run immediately on start
  await syncCycle().catch(e => log(e.message, "error"));

  // Then on interval
  setInterval(async () => {
    await syncCycle().catch(e => log(e.message, "error"));
  }, INTERVAL_MS);
})();
