/**
 * routes/ai.js — AI-powered endpoints for Mustikatama ERP
 *
 * Endpoints:
 *   POST /api/ai/parse       — Document intelligence (invoice / PO / delivery note)
 *   POST /api/ai/query       — Natural language query with SSE streaming
 *   GET  /api/ai/forecast    — 90-day cash flow forecast + Claude narrative
 *   GET  /api/ai/anomalies   — Smart anomaly detection on AR/AP data
 */

"use strict";

const router      = require("express").Router();
const { requireAuth } = require("./auth");
const pool        = require("../db/pool");
const Anthropic   = require("@anthropic-ai/sdk");

// ── Helpers ──────────────────────────────────────────────────────────────────

const MODEL      = "claude-sonnet-4-5";
const IDR_THRESHOLD = 500_000_000; // Rp 500 juta cash-shortage threshold
const USD_TO_IDR    = 15_560;      // approximate rate

/**
 * Return a configured Anthropic client, or null when the key is not set.
 */
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Middleware: guard every route in this file. Check key before hitting Claude.
 */
function requireAI(req, res, next) {
  if (!process.env.ANTHROPIC_API_KEY) {
    // forecast & anomalies fall back to local-only; parse & query cannot
    req._noAI = true;
  }
  next();
}

// Apply auth + AI-availability check to all routes
router.use(requireAuth);
router.use(requireAI);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/parse — Document intelligence
// ─────────────────────────────────────────────────────────────────────────────
router.post("/parse", async (req, res) => {
  if (req._noAI) {
    return res.status(503).json({ error: "AI features require ANTHROPIC_API_KEY", demo: true });
  }

  const { text, type } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Field 'text' wajib diisi dan berupa string" });
  }
  if (!["ap_invoice", "po", "delivery_note"].includes(type)) {
    return res.status(400).json({ error: "Field 'type' harus: ap_invoice | po | delivery_note" });
  }

  const client = getClient();
  const docLabel =
    type === "ap_invoice"    ? "AP Invoice / Faktur Pembelian"
    : type === "po"          ? "Purchase Order"
    : "Delivery Note / Surat Jalan";

  const systemPrompt =
    "You are a financial data extraction assistant for an Indonesian plywood company. " +
    "Extract structured invoice data from the document. " +
    "Return ONLY valid JSON, no explanation, no markdown. " +
    "If a field cannot be determined, use null.";

  const userPrompt =
    `Document type: ${docLabel}\n\n` +
    `Return a single JSON object with these exact keys:\n` +
    `{\n` +
    `  "vendor_name": string|null,\n` +
    `  "inv_no": string|null,\n` +
    `  "date": "YYYY-MM-DD"|null,\n` +
    `  "due_date": "YYYY-MM-DD"|null,\n` +
    `  "total": number|null,\n` +
    `  "currency": "IDR"|"USD"|"EUR"|null,\n` +
    `  "description": string|null,\n` +
    `  "items": [\n` +
    `    { "description": string, "qty": number|null, "unit": string|null, "unit_price": number|null, "total": number|null }\n` +
    `  ],\n` +
    `  "confidence": 0.0-1.0,\n` +
    `  "notes": string|null\n` +
    `}\n\n` +
    `Document text:\n---\n${text}\n---`;

  try {
    const msg = await client.messages.create({
      model:      MODEL,
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw = msg.content?.[0]?.text || "{}";

    // Strip accidental markdown fences
    const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(422).json({
        error:  "Claude returned non-JSON response",
        raw:    cleaned.slice(0, 500),
      });
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[ai/parse] Claude error:", err.message);
    return res.status(500).json({ error: "AI parsing failed", detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/query — Natural language query (SSE streaming)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/query", async (req, res) => {
  if (req._noAI) {
    return res.status(503).json({ error: "AI features require ANTHROPIC_API_KEY", demo: true });
  }

  const { question, context = {} } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Field 'question' wajib diisi" });
  }

  const client = getClient();

  const systemPrompt =
    "You are an ERP assistant for PT. Mustikatama Graha Persada, an Indonesian plywood export company. " +
    "Answer questions about the provided business data clearly and concisely. " +
    "Respond in the same language as the question (Indonesian or English). " +
    "Include specific numbers when relevant. " +
    "Format numbers in Indonesian style (Rp 1.200.000).";

  // Serialise context — truncate large arrays to avoid token bloat
  const safeCtx = JSON.stringify(context, null, 2).slice(0, 12_000);
  const userPrompt = `Business data context:\n${safeCtx}\n\nQuestion: ${question}`;

  // Set SSE headers before streaming starts
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.flushHeaders();

  try {
    const stream = await client.messages.stream({
      model:      MODEL,
      max_tokens: 2048,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    for await (const chunk of stream) {
      if (chunk.type === "content_block_delta" && chunk.delta?.type === "text_delta") {
        const delta = chunk.delta.text;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("[ai/query] Claude stream error:", err.message);
    // Try to send error event if headers not flushed yet
    try {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.write("data: [DONE]\n\n");
    } catch {}
    res.end();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/forecast — 90-day cash flow projection
// ─────────────────────────────────────────────────────────────────────────────
router.get("/forecast", async (req, res) => {
  try {
    // ── 1. Pull data from DB ────────────────────────────────────────────────
    const [arRows, apRows, bankRows] = await Promise.all([
      pool.query(`
        SELECT due_date, total_amount, currency
        FROM   ar_invoices
        WHERE  status IN ('unpaid','partial')
          AND  due_date IS NOT NULL
      `),
      pool.query(`
        SELECT due_date, total_amount, currency
        FROM   ap_invoices
        WHERE  status IN ('unpaid','partial')
          AND  due_date IS NOT NULL
      `),
      pool.query(`
        SELECT balance, currency
        FROM   bank_accounts
        WHERE  is_active = true
      `),
    ]);

    const arInvoices   = arRows.rows;
    const apInvoices   = apRows.rows;
    const bankAccounts = bankRows.rows;

    // ── 2. Calculate initial cash (IDR) ────────────────────────────────────
    const initialCash = bankAccounts.reduce((sum, b) => {
      const amt = parseFloat(b.balance) || 0;
      return sum + (b.currency === "USD" ? amt * USD_TO_IDR : amt);
    }, 0);

    // ── 3. Build daily buckets for 90 days ─────────────────────────────────
    const today    = new Date();
    today.setHours(0, 0, 0, 0);
    const DAYS     = 90;
    const dayMap   = {}; // "YYYY-MM-DD" → { inflow, outflow }

    function toIDR(amount, currency) {
      const n = parseFloat(amount) || 0;
      return currency === "USD" ? n * USD_TO_IDR : n;
    }

    function dateKey(d) {
      return new Date(d).toISOString().slice(0, 10);
    }

    for (const inv of arInvoices) {
      const k = dateKey(inv.due_date);
      if (!dayMap[k]) dayMap[k] = { inflow: 0, outflow: 0 };
      dayMap[k].inflow += toIDR(inv.total_amount, inv.currency);
    }
    for (const inv of apInvoices) {
      const k = dateKey(inv.due_date);
      if (!dayMap[k]) dayMap[k] = { inflow: 0, outflow: 0 };
      dayMap[k].outflow += toIDR(inv.total_amount, inv.currency);
    }

    // ── 4. Running balance + chart data ────────────────────────────────────
    const chartData   = [];
    const risks       = [];
    let   balance     = initialCash;
    let   cumInflow   = 0;
    let   cumOutflow  = 0;
    let   minBalance  = balance;
    let   minDate     = today.toISOString().slice(0, 10);

    for (let i = 0; i < DAYS; i++) {
      const d   = new Date(today);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);

      const { inflow = 0, outflow = 0 } = dayMap[key] || {};
      balance    += inflow - outflow;
      cumInflow  += inflow;
      cumOutflow += outflow;

      const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      chartData.push({ date: key, label, balance, inflow, outflow, cumInflow, cumOutflow });

      if (balance < minBalance) {
        minBalance = balance;
        minDate    = key;
      }
      if (balance < IDR_THRESHOLD && outflow > 0) {
        risks.push({
          date:        key,
          amount:      balance,
          description: `Saldo kas proyeksi di bawah Rp 500 juta (Rp ${Math.round(balance).toLocaleString("id-ID")})`,
        });
      }
    }

    const finalBalance = chartData[chartData.length - 1]?.balance ?? initialCash;

    // ── 5. Claude narrative (optional — skip if no key) ────────────────────
    let narrative = null;

    if (!req._noAI) {
      const client = getClient();
      const fmt    = (n) => `Rp ${Math.round(n).toLocaleString("id-ID")}`;
      const narrPrompt =
        `Buat narasi eksekutif 3-4 kalimat dalam Bahasa Indonesia tentang proyeksi arus kas 90 hari berikut:\n` +
        `- Kas awal: ${fmt(initialCash)}\n` +
        `- Kas akhir proyeksi (hari ke-90): ${fmt(finalBalance)}\n` +
        `- Saldo minimum: ${fmt(minBalance)} (pada ${minDate})\n` +
        `- Total AR masuk: ${fmt(cumInflow)}\n` +
        `- Total AP keluar: ${fmt(cumOutflow)}\n` +
        `- Jumlah periode kekurangan kas (< Rp 500 juta): ${risks.length}\n` +
        `Fokus pada implikasi bisnis dan rekomendasi singkat.`;

      try {
        const msg = await client.messages.create({
          model:      MODEL,
          max_tokens: 512,
          messages:   [{ role: "user", content: narrPrompt }],
        });
        narrative = msg.content?.[0]?.text?.trim() || null;
      } catch (err) {
        console.error("[ai/forecast] Claude narrative error:", err.message);
        // Fall back gracefully — narrative stays null
      }
    }

    return res.json({
      chartData,
      initialCash,
      minBalance,
      minDate,
      finalBalance,
      narrative,
      risks,
    });
  } catch (err) {
    console.error("[ai/forecast] Error:", err.message);
    return res.status(500).json({ error: "Forecast gagal", detail: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/anomalies — Smart anomaly detection
// ─────────────────────────────────────────────────────────────────────────────
router.get("/anomalies", async (req, res) => {
  try {
    // ── 1. Pull data ────────────────────────────────────────────────────────
    const cutoff90 = new Date();
    cutoff90.setDate(cutoff90.getDate() - 90);

    const [recentAP, recentAR, vendorAvg, totalAP] = await Promise.all([
      // AP invoices in the last 90 days
      pool.query(`
        SELECT id, vendor_id, inv_no, total_amount, currency, invoice_date, due_date, status
        FROM   ap_invoices
        WHERE  invoice_date >= $1
        ORDER  BY invoice_date DESC
      `, [cutoff90]),

      // Open AR invoices — to find overdue ones
      pool.query(`
        SELECT id, customer_id, inv_no, total_amount, currency, due_date, status
        FROM   ar_invoices
        WHERE  status IN ('unpaid','partial')
          AND  due_date IS NOT NULL
      `),

      // Vendor historical averages (need >= 3 invoices for significance)
      pool.query(`
        SELECT vendor_id, AVG(total_amount) AS avg_amount, COUNT(*) AS invoice_count
        FROM   ap_invoices
        WHERE  invoice_date < $1           -- exclude recent 90 days to get baseline
        GROUP  BY vendor_id
        HAVING COUNT(*) >= 3
      `, [cutoff90]),

      // Total AP outstanding
      pool.query(`
        SELECT vendor_id, SUM(total_amount) AS vendor_total
        FROM   ap_invoices
        WHERE  status IN ('unpaid','partial')
        GROUP  BY vendor_id
      `),
    ]);

    const apRows   = recentAP.rows;
    const arRows   = recentAR.rows;
    const avgMap   = {}; // vendor_id → { avg_amount, invoice_count }
    for (const r of vendorAvg.rows) avgMap[r.vendor_id] = r;

    // Total AP across all vendors
    const grandTotalAP = totalAP.rows.reduce((s, r) => s + parseFloat(r.vendor_total || 0), 0);

    // ── 2. Local anomaly detection ──────────────────────────────────────────
    const flagged = [];

    // A) Duplicate AP: same vendor, amount within 5%, within 30 days
    for (let i = 0; i < apRows.length; i++) {
      for (let j = i + 1; j < apRows.length; j++) {
        const a = apRows[i];
        const b = apRows[j];
        if (a.vendor_id !== b.vendor_id) continue;

        const diff = Math.abs(parseFloat(a.total_amount) - parseFloat(b.total_amount));
        const base = parseFloat(a.total_amount) || 1;
        if (diff / base > 0.05) continue;

        const daysBetween =
          Math.abs(new Date(a.invoice_date) - new Date(b.invoice_date)) / 86_400_000;
        if (daysBetween > 30) continue;

        flagged.push({
          type:     "duplicate_ap",
          severity: "high",
          data:     { invoiceA: a, invoiceB: b, daysBetween: Math.round(daysBetween) },
        });
      }
    }

    // B) Unusual amount: > 2.5× vendor average
    for (const inv of apRows) {
      const baseline = avgMap[inv.vendor_id];
      if (!baseline) continue;
      const ratio = parseFloat(inv.total_amount) / parseFloat(baseline.avg_amount);
      if (ratio > 2.5) {
        flagged.push({
          type:     "unusual_amount",
          severity: ratio > 5 ? "high" : "medium",
          data:     { invoice: inv, vendorAvg: baseline.avg_amount, ratio: ratio.toFixed(2) },
        });
      }
    }

    // C) Very overdue AR: > 90 days past due
    const today90 = new Date();
    today90.setDate(today90.getDate() - 90);
    for (const inv of arRows) {
      const due = new Date(inv.due_date);
      if (due < today90) {
        const overdueDays = Math.round((Date.now() - due) / 86_400_000);
        flagged.push({
          type:     "overdue_ar",
          severity: overdueDays > 180 ? "high" : "medium",
          data:     { invoice: inv, overdueDays },
        });
      }
    }

    // D) AP concentration: single vendor > 60% of total AP outstanding
    for (const row of totalAP.rows) {
      if (grandTotalAP === 0) continue;
      const pct = parseFloat(row.vendor_total) / grandTotalAP;
      if (pct > 0.6) {
        flagged.push({
          type:     "ap_concentration",
          severity: "medium",
          data:     { vendor_id: row.vendor_id, vendor_total: row.vendor_total, percentage: (pct * 100).toFixed(1) },
        });
      }
    }

    // ── 3. Claude enrichment (optional) ────────────────────────────────────
    if (flagged.length === 0) {
      return res.json({ anomalies: [] });
    }

    if (req._noAI) {
      // Return local-only results without AI descriptions
      return res.json({
        anomalies: flagged.map((f) => ({
          type:        f.type,
          severity:    f.severity,
          title:       localTitle(f.type),
          description: localDescription(f),
          action:      null,
          data:        f.data,
        })),
      });
    }

    const client = getClient();
    const summary = JSON.stringify(flagged.slice(0, 20), null, 2).slice(0, 6000); // cap tokens

    const claudePrompt =
      `Kamu adalah analis keuangan ERP untuk perusahaan ekspor plywood Indonesia (PT. Mustikatama Graha Persada).\n` +
      `Berikut adalah daftar anomali yang terdeteksi secara otomatis dalam data AP/AR:\n\n` +
      `${summary}\n\n` +
      `Untuk setiap anomali, berikan:\n` +
      `- title: judul singkat (maks 60 karakter)\n` +
      `- description: penjelasan 1-2 kalimat dalam Bahasa Indonesia\n` +
      `- action: rekomendasi tindakan 1 kalimat\n\n` +
      `Return ONLY a JSON array dengan urutan yang sama:\n` +
      `[{"title":"...","description":"...","action":"..."}]`;

    let enriched = null;
    try {
      const msg = await client.messages.create({
        model:      MODEL,
        max_tokens: 1024,
        messages:   [{ role: "user", content: claudePrompt }],
      });
      const raw     = msg.content?.[0]?.text || "[]";
      const cleaned = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
      enriched = JSON.parse(cleaned);
    } catch (err) {
      console.error("[ai/anomalies] Claude error:", err.message);
      // Fall back to local descriptions
    }

    const anomalies = flagged.map((f, idx) => {
      const ai = enriched?.[idx] || {};
      return {
        type:        f.type,
        severity:    f.severity,
        title:       ai.title       || localTitle(f.type),
        description: ai.description || localDescription(f),
        action:      ai.action      || null,
        data:        f.data,
      };
    });

    return res.json({ anomalies });
  } catch (err) {
    console.error("[ai/anomalies] Error:", err.message);
    return res.status(500).json({ error: "Anomaly detection gagal", detail: err.message });
  }
});

// ── Local fallback labels ─────────────────────────────────────────────────────

function localTitle(type) {
  return {
    duplicate_ap:    "Potensi Duplikasi AP",
    unusual_amount:  "Jumlah AP Tidak Biasa",
    overdue_ar:      "AR Sangat Jatuh Tempo",
    ap_concentration:"Konsentrasi AP Tinggi",
  }[type] || "Anomali Terdeteksi";
}

function localDescription(f) {
  switch (f.type) {
    case "duplicate_ap":
      return `Invoice ${f.data.invoiceA?.inv_no} dan ${f.data.invoiceB?.inv_no} dari vendor yang sama dengan jumlah hampir identik dalam ${f.data.daysBetween} hari.`;
    case "unusual_amount":
      return `Invoice ${f.data.invoice?.inv_no} sebesar ${f.data.ratio}× rata-rata historis vendor ini.`;
    case "overdue_ar":
      return `Invoice AR ${f.data.invoice?.inv_no} sudah ${f.data.overdueDays} hari melewati tanggal jatuh tempo.`;
    case "ap_concentration":
      return `Satu vendor memegang ${f.data.percentage}% dari total AP outstanding.`;
    default:
      return "Anomali terdeteksi dalam data transaksi.";
  }
}

module.exports = router;
