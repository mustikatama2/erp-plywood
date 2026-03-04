import { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

const ActivityCtx = createContext(null);
const STORAGE_KEY = "erp_activity_log";
const MAX_ENTRIES = 200;

// ── Seed data ────────────────────────────────────────────────────────────────
const now = new Date();
const ts = (h, m = 0) => new Date(now.getTime() - h * 3600000 - m * 60000).toISOString();

const SEED_ENTRIES = [
  {
    id: "act-seed-01",
    timestamp: ts(0, 15),
    user: { id: "u3", name: "Budi Santoso", role: "sales" },
    action: "CREATE",
    module: "Sales",
    entity_type: "SalesOrder",
    entity_id: "so4",
    entity_label: "SO-2026-0143",
    description: "Membuat Sales Order SO-2026-0143 untuk Yamamoto Trading Co.",
    metadata: { customer: "Yamamoto Trading Co.", total: "USD 42,500" },
  },
  {
    id: "act-seed-02",
    timestamp: ts(1, 30),
    user: { id: "u2", name: "Sari Dewi", role: "finance" },
    action: "PAYMENT",
    module: "Finance",
    entity_type: "Invoice",
    entity_id: "inv-001",
    entity_label: "INV-2026-0201",
    description: "Mencatat pembayaran INV-2026-0201 dari Hanwha Solutions · USD 38,000",
    metadata: { amount: "USD 38,000", method: "T/T Bank Transfer" },
  },
  {
    id: "act-seed-03",
    timestamp: ts(2, 45),
    user: { id: "u4", name: "Wahyu Prasetyo", role: "purchasing" },
    action: "APPROVE",
    module: "Purchasing",
    entity_type: "PurchaseOrder",
    entity_id: "po1",
    entity_label: "PO-2026-0324",
    description: "Menyetujui Purchase Order PO-2026-0324 dari PT Tanjung Kayu Manis",
    metadata: { vendor: "PT Tanjung Kayu Manis", total: "Rp 185.400.000" },
  },
  {
    id: "act-seed-04",
    timestamp: ts(3),
    user: { id: "u1", name: "Administrator", role: "admin" },
    action: "POST",
    module: "Finance",
    entity_type: "JournalEntry",
    entity_id: "je-045",
    entity_label: "JE-045",
    description: "Memposting jurnal akuntansi JE-045 — Penerimaan kas dari ekspor",
    metadata: { debit: "Rp 590.280.000", credit: "Rp 590.280.000" },
  },
  {
    id: "act-seed-05",
    timestamp: ts(5),
    user: { id: "u5", name: "Doni Kurniawan", role: "warehouse" },
    action: "UPDATE",
    module: "Inventory",
    entity_type: "StockMovement",
    entity_id: "mov-212",
    entity_label: "Plywood 18mm BB/CC",
    description: "Mencatat pengeluaran stok: 850 lembar Plywood 18mm BB/CC untuk SO-2026-0141",
    metadata: { qty: -850, unit: "lembar", product: "Plywood 18mm BB/CC" },
  },
  {
    id: "act-seed-06",
    timestamp: ts(6, 30),
    user: { id: "u3", name: "Budi Santoso", role: "sales" },
    action: "CREATE",
    module: "Sales",
    entity_type: "Shipment",
    entity_id: "sh3",
    entity_label: "B/L: OOCU-2026-0089",
    description: "Membuat data pengiriman B/L OOCU-2026-0089 — Osaka, Japan · 40'HQ",
    metadata: { bl_no: "OOCU-2026-0089", destination: "Osaka, Japan", container: "40'HQ" },
  },
  {
    id: "act-seed-07",
    timestamp: ts(8),
    user: { id: "u6", name: "Rini Setiawati", role: "hr" },
    action: "CREATE",
    module: "HR",
    entity_type: "Employee",
    entity_id: "emp-042",
    entity_label: "Fajar Nugroho",
    description: "Menambahkan karyawan baru: Fajar Nugroho — Operator Produksi",
    metadata: { dept: "Produksi", position: "Operator" },
  },
  {
    id: "act-seed-08",
    timestamp: ts(10),
    user: { id: "u2", name: "Sari Dewi", role: "finance" },
    action: "CREATE",
    module: "Finance",
    entity_type: "Invoice",
    entity_id: "inv-012",
    entity_label: "INV-2026-0205",
    description: "Membuat invoice INV-2026-0205 untuk Mitsui & Co. Ltd · USD 52,750",
    metadata: { customer: "Mitsui & Co. Ltd", amount: "USD 52,750" },
  },
  {
    id: "act-seed-09",
    timestamp: ts(24),
    user: { id: "u1", name: "Administrator", role: "admin" },
    action: "LOGIN",
    module: "Admin",
    entity_type: "Session",
    entity_id: "sess-001",
    entity_label: "Administrator",
    description: "Login ke sistem ERP",
    metadata: { ip: "192.168.1.10" },
  },
  {
    id: "act-seed-10",
    timestamp: ts(26),
    user: { id: "u4", name: "Wahyu Prasetyo", role: "purchasing" },
    action: "CREATE",
    module: "Purchasing",
    entity_type: "PurchaseOrder",
    entity_id: "po-new-01",
    entity_label: "PO-2026-0325",
    description: "Membuat Purchase Order PO-2026-0325 untuk pengadaan veneer sengon",
    metadata: { vendor: "CV Rimba Jaya", product: "Veneer Sengon 1.5mm" },
  },
];

// ── Load from localStorage with seed fallback ─────────────────────────────
function loadLog() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return SEED_ENTRIES;
}

function saveLog(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch { /* ignore quota */ }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function ActivityProvider({ children }) {
  const [log, setLog] = useState(() => loadLog());
  const auth = useAuth();

  const track = useCallback((action, module, entity_type, entity_id, entity_label, description, metadata = {}) => {
    const user = auth?.user
      ? { id: auth.user.id, name: auth.user.name, role: auth.user.role }
      : { id: "system", name: "System", role: "system" };

    const entry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      user,
      action,
      module,
      entity_type,
      entity_id,
      entity_label,
      description,
      metadata,
    };

    setLog(prev => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      saveLog(updated);
      return updated;
    });

    return entry;
  }, [auth?.user]);

  const getRecent = useCallback((n = 20) => log.slice(0, n), [log]);
  const getByModule = useCallback((module) => log.filter(e => e.module === module), [log]);
  const getByUser = useCallback((userId) => log.filter(e => e.user.id === userId), [log]);

  return (
    <ActivityCtx.Provider value={{ log, track, getRecent, getByModule, getByUser }}>
      {children}
    </ActivityCtx.Provider>
  );
}

export const useActivity = () => {
  const ctx = useContext(ActivityCtx);
  if (!ctx) throw new Error("useActivity must be used inside ActivityProvider");
  return ctx;
};
