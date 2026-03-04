import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal, toast } from "../../components/ui";
import { IDR, DATE, NUM, PCT } from "../../lib/fmt";

// ── Seed Data ─────────────────────────────────────────────────────────────────
const PREPAID_SEED = [
  {
    id: "bp001", code: "BP-2026-001",
    description: "Asuransi Pabrik 2026",
    category: "Insurance", total_amount: 120000000,
    payment_date: "2026-01-01", start_date: "2026-01-01", end_date: "2026-12-31",
    notes: "PT Asuransi Tugu Pratama",
  },
  {
    id: "bp002", code: "BP-2026-002",
    description: "Sertifikasi SVLK 2025-2026",
    category: "Certification", total_amount: 45000000,
    payment_date: "2025-07-01", start_date: "2025-07-01", end_date: "2026-06-30",
    notes: "Lembaga PHPL",
  },
  {
    id: "bp003", code: "BP-2026-003",
    description: "Software ERP License",
    category: "License", total_amount: 60000000,
    payment_date: "2026-01-15", start_date: "2026-02-01", end_date: "2027-01-31",
    notes: "12-month subscription",
  },
  {
    id: "bp004", code: "BP-2025-004",
    description: "Sewa Gudang Eksternal",
    category: "Rental", total_amount: 180000000,
    payment_date: "2025-04-01", start_date: "2025-04-01", end_date: "2026-03-31",
    notes: "Gudang Pandanrejo, Lumajang",
  },
  {
    id: "bp005", code: "BP-2026-005",
    description: "Asuransi Armada Truk",
    category: "Insurance", total_amount: 36000000,
    payment_date: "2026-01-01", start_date: "2026-01-01", end_date: "2026-12-31",
    notes: "6 unit kendaraan operasional",
  },
];

const CATEGORIES = ["All", "Insurance", "License", "Rental", "Certification", "Other"];

// ── Amortization helpers ──────────────────────────────────────────────────────
function calcAmortization(entry) {
  const startDate = new Date(entry.start_date);
  const endDate   = new Date(entry.end_date);
  const today     = new Date();

  // Duration in months (inclusive of start month)
  const durationMonths = Math.max(1,
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth()   - startDate.getMonth()) + 1
  );
  const monthly = entry.total_amount / durationMonths;

  // Months elapsed (from start_date to today)
  const rawElapsed =
    (today.getFullYear() - startDate.getFullYear()) * 12 +
    (today.getMonth()    - startDate.getMonth());
  const monthsElapsed = Math.max(0, Math.min(rawElapsed, durationMonths));

  const amortized     = Math.min(monthly * monthsElapsed, entry.total_amount);
  const remaining     = entry.total_amount - amortized;
  const pctAmortized  = (amortized / entry.total_amount) * 100;

  // Determine status
  const startTs = startDate.getTime();
  const endTs   = endDate.getTime();
  const todayTs = today.getTime();
  let status;
  if (amortized >= entry.total_amount || pctAmortized >= 99.9) status = "Paid"; // fully amortized
  else if (todayTs > endTs) status = "Overdue";
  else if (todayTs < startTs) status = "Pending";
  else status = "Active";

  // Expiring this month?
  const expiresThisMonth =
    endDate.getFullYear() === today.getFullYear() &&
    endDate.getMonth()    === today.getMonth();

  return {
    monthly, amortized, remaining, pctAmortized,
    monthsElapsed, durationMonths, status, expiresThisMonth,
  };
}

function buildAmortSchedule(entry) {
  const durationMonths = Math.max(1,
    (() => {
      const s = new Date(entry.start_date);
      const e = new Date(entry.end_date);
      return (e.getFullYear() - s.getFullYear()) * 12 +
             (e.getMonth()   - s.getMonth()) + 1;
    })()
  );
  const monthly = entry.total_amount / durationMonths;
  const rows = [];
  let remaining = entry.total_amount;
  const startDate = new Date(entry.start_date);

  for (let i = 0; i < durationMonths; i++) {
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
    const label = d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    remaining -= monthly;
    rows.push({
      month_label: label,
      charge:      monthly,
      balance:     Math.max(0, remaining),
    });
  }
  return rows;
}

// ── New Entry Modal ───────────────────────────────────────────────────────────
const EMPTY_FORM = {
  description: "", category: "Insurance", total_amount: "",
  payment_date: "", start_date: "", end_date: "", notes: "",
};

function genCode(entries) {
  const year = new Date().getFullYear();
  const maxNum = entries.reduce((m, e) => {
    const parts = e.code.split("-");
    const n = parseInt(parts[parts.length - 1], 10);
    return n > m ? n : m;
  }, 0);
  return `BP-${year}-${String(maxNum + 1).padStart(3, "0")}`;
}

function NewEntryModal({ onClose, onSave, entries }) {
  const [form, setFormState] = useState(EMPTY_FORM);
  const [saving, setSaving]  = useState(false);
  const set = (field) => (e) => setFormState(f => ({ ...f, [field]: e.target.value }));

  const amount    = parseFloat(form.total_amount) || 0;
  const startDate = form.start_date ? new Date(form.start_date) : null;
  const endDate   = form.end_date   ? new Date(form.end_date)   : null;

  const durationMonths = (startDate && endDate && endDate > startDate)
    ? Math.max(1,
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth()   - startDate.getMonth()) + 1
      )
    : 0;
  const monthly = durationMonths > 0 ? amount / durationMonths : 0;

  // Schedule preview (first 6 months max)
  const previewSched = useMemo(() => {
    if (!startDate || !endDate || durationMonths <= 0 || amount <= 0) return [];
    const rows = [];
    let rem = amount;
    const m = amount / durationMonths;
    for (let i = 0; i < Math.min(durationMonths, 6); i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      rem -= m;
      rows.push({
        month: d.toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
        charge: m,
        balance: Math.max(0, rem),
      });
    }
    return rows;
  }, [form.start_date, form.end_date, form.total_amount]);

  const handleSave = async () => {
    if (!form.description)  { toast("Deskripsi wajib diisi", "error"); return; }
    if (!form.total_amount || amount <= 0) { toast("Jumlah wajib diisi", "error"); return; }
    if (!form.payment_date) { toast("Tanggal pembayaran wajib diisi", "error"); return; }
    if (!form.start_date || !form.end_date) { toast("Periode amortisasi wajib diisi", "error"); return; }
    if (endDate <= startDate) { toast("Tanggal akhir harus setelah tanggal mulai", "error"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const code = genCode(entries);
    toast(`✅ Entri ${code} berhasil dicatat`);
    onSave({ ...form, id: `bp${Date.now()}`, code, total_amount: amount });
    onClose();
  };

  return (
    <Modal title="+ Entri Biaya Dibayar di Muka" subtitle="Amortisasi biaya yang dibayar di awal" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div>
          <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Deskripsi</label>
          <input value={form.description} onChange={set("description")} className="erp-input"
            placeholder="Misal: Asuransi Pabrik 2026" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Kategori</label>
            <select value={form.category} onChange={set("category")} className="erp-input">
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Jumlah Total (IDR)</label>
            <input type="number" value={form.total_amount} onChange={set("total_amount")} className="erp-input"
              placeholder="120000000" />
            {amount > 0 && <p className="text-xs text-gray-500 mt-0.5">{IDR(amount)}</p>}
          </div>
        </div>

        <div>
          <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Tanggal Pembayaran</label>
          <input type="date" value={form.payment_date} onChange={set("payment_date")} className="erp-input" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Periode Mulai</label>
            <input type="date" value={form.start_date} onChange={set("start_date")} className="erp-input" />
          </div>
          <div>
            <label className="erp-label after:content-['*'] after:text-red-700 after:ml-0.5">Periode Akhir</label>
            <input type="date" value={form.end_date} onChange={set("end_date")} className="erp-input" />
          </div>
        </div>

        {durationMonths > 0 && amount > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">📊 Kalkulasi Amortisasi</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Durasi</p>
                <p className="font-bold text-gray-900">{durationMonths} bulan</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Beban / Bulan</p>
                <p className="font-bold text-blue-300">{IDR(monthly)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Per Tahun (est.)</p>
                <p className="font-bold text-gray-700">{IDR(monthly * 12)}</p>
              </div>
            </div>
            {previewSched.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1.5">Preview jadwal (6 bulan pertama):</p>
                <table className="erp-table w-full text-xs">
                  <thead>
                    <tr><th>Bulan</th><th className="text-right">Beban</th><th className="text-right">Saldo</th></tr>
                  </thead>
                  <tbody>
                    {previewSched.map((r, i) => (
                      <tr key={i}>
                        <td>{r.month}</td>
                        <td className="text-right font-mono text-blue-300">{IDR(r.charge)}</td>
                        <td className="text-right font-mono">{IDR(r.balance)}</td>
                      </tr>
                    ))}
                    {durationMonths > 6 && (
                      <tr>
                        <td colSpan={3} className="text-gray-500 text-center italic">
                          … {durationMonths - 6} bulan berikutnya
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="erp-label">Catatan</label>
          <textarea value={form.notes} onChange={set("notes")} className="erp-input min-h-[60px]"
            placeholder="Misal: Nomor polis, nama lembaga, dll." />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : "💾 Simpan Entri"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
const CAT_ICONS = {
  Insurance: "🛡️", License: "💿", Rental: "🏢", Certification: "📜", Other: "📦",
};

function BiayaDetailModal({ entry, onClose }) {
  const calc     = calcAmortization(entry);
  const schedule = buildAmortSchedule(entry);

  return (
    <Modal
      title={entry.description}
      subtitle={`${entry.code} · ${entry.category}`}
      onClose={onClose}
      width="max-w-2xl"
    >
      <div className="p-5 space-y-5">
        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {[
            ["Kode",              entry.code],
            ["Kategori",          `${CAT_ICONS[entry.category] || "📦"} ${entry.category}`],
            ["Tanggal Bayar",     DATE(entry.payment_date)],
            ["Periode Mulai",     DATE(entry.start_date)],
            ["Periode Akhir",     DATE(entry.end_date)],
            ["Total Dibayar",     IDR(entry.total_amount)],
            ["Durasi",            `${calc.durationMonths} bulan`],
            ["Amortisasi / Bln",  IDR(calc.monthly)],
            ["Catatan",           entry.notes || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500">{k}</p>
              <p className="font-semibold text-gray-900 mt-0.5 text-sm">{v}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progres Amortisasi: {PCT(calc.pctAmortized)}</span>
            <span>{calc.monthsElapsed} bln / {calc.durationMonths} bln</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-teal-400 transition-all"
              style={{ width: `${Math.min(calc.pctAmortized, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5">
            <span className="text-blue-300">Terpakai: {IDR(calc.amortized)}</span>
            <span className="text-teal-300">Saldo: {IDR(calc.remaining)}</span>
          </div>
        </div>

        {/* Amortization schedule */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">
            Jadwal Amortisasi Bulanan
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="erp-table w-full text-sm">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bulan</th>
                  <th className="text-right">Beban</th>
                  <th className="text-right">Saldo Sisa</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => {
                  const isCurrent = i === calc.monthsElapsed - 1;
                  const isPast    = i < calc.monthsElapsed;
                  return (
                    <tr key={i} className={isCurrent ? "bg-blue-500/10" : isPast ? "opacity-50" : ""}>
                      <td className="text-gray-500">{i + 1}</td>
                      <td>
                        {row.month_label}
                        {isCurrent && <span className="ml-1 text-xs text-blue-700">← Bulan ini</span>}
                      </td>
                      <td className="text-right font-mono text-blue-300">{IDR(row.charge)}</td>
                      <td className="text-right font-mono font-bold">
                        <span className={row.balance <= 0 ? "text-green-700" : "text-gray-900"}>
                          {IDR(row.balance)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
          {calc.status === "Active" && (
            <Btn variant="success" onClick={() => {
              toast(`✅ Amortisasi ${IDR(calc.monthly)} bulan ini berhasil dicatat`);
            }}>
              📝 Catat Amortisasi Bulan Ini
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Biaya() {
  const [entries, setEntries] = useState(PREPAID_SEED);
  const [search,      setSearch]      = useState("");
  const [catFilter,   setCatFilter]   = useState("All");
  const [selected,    setSelected]    = useState(null);
  const [showAdd,     setShowAdd]     = useState(false);

  // Enrich with live-computed amortization
  const enriched = useMemo(() =>
    entries.map(e => ({ ...e, _calc: calcAmortization(e) })),
    [entries]
  );

  // KPIs
  const totalBalance   = enriched.reduce((s, e) => s + e._calc.remaining, 0);
  const monthlyCharge  = enriched
    .filter(e => e._calc.status === "Active")
    .reduce((s, e) => s + e._calc.monthly, 0);
  const expiringCount  = enriched.filter(e => e._calc.expiresThisMonth).length;
  const fullyAmortized = enriched.filter(e => e._calc.pctAmortized >= 99.9).length;

  // Filter
  const filtered = enriched
    .filter(e => catFilter === "All" || e.category === catFilter)
    .filter(e =>
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.code.toLowerCase().includes(search.toLowerCase())
    );

  const handleAddSave = (newEntry) => {
    setEntries(prev => [...prev, newEntry]);
  };

  // Status badge color mapping
  const statusBadgeClass = (status) => {
    if (status === "Active")  return "text-green-700 bg-green-500/10";
    if (status === "Paid")    return "text-gray-400 bg-gray-100";
    if (status === "Overdue") return "text-red-700 bg-red-500/10";
    if (status === "Pending") return "text-amber-700 bg-amber-500/10";
    return "text-gray-400 bg-gray-100";
  };

  return (
    <div>
      <PageHeader
        title="Biaya Dibayar di Muka"
        subtitle="Amortisasi biaya operasional yang dibayar di awal (prepaid expenses)"
        actions={<Btn onClick={() => setShowAdd(true)}>+ Tambah Entri</Btn>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="Total Saldo Prepaid"
          value={IDR(totalBalance)}
          icon="💼"
          color="text-amber-700"
          sub="Belum terbebankan"
        />
        <KPICard
          label="Amortisasi / Bulan"
          value={IDR(monthlyCharge)}
          icon="🗓️"
          color="text-teal-400"
          sub="Entri aktif"
        />
        <KPICard
          label="Berakhir Bulan Ini"
          value={expiringCount}
          icon="⚠️"
          color={expiringCount > 0 ? "text-red-700" : "text-green-700"}
          sub="Perlu diperbarui"
        />
        <KPICard
          label="Selesai Diamortisasi"
          value={fullyAmortized}
          icon="✅"
          color="text-blue-700"
          sub="Dari total entri"
        />
      </div>

      {/* Table */}
      <Card>
        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari deskripsi, kode…" />
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  catFilter === c
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}>
                {c === "All" ? "Semua" : c}{" "}
                <span className="ml-1 opacity-70">
                  {c === "All"
                    ? enriched.length
                    : enriched.filter(e => e.category === c).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Table
          onRowClick={setSelected}
          data={filtered}
          columns={[
            {
              key: "code",
              label: "Kode",
              render: v => <span className="font-mono text-xs text-blue-700 font-bold">{v}</span>,
            },
            {
              key: "description",
              label: "Deskripsi",
              render: (v, row) => (
                <div>
                  <p className="font-medium text-gray-900">{v}</p>
                  <p className="text-xs text-gray-500">{row.notes}</p>
                </div>
              ),
            },
            {
              key: "category",
              label: "Kategori",
              render: v => (
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                  {CAT_ICONS[v] || "📦"} {v}
                </span>
              ),
            },
            {
              key: "total_amount",
              label: "Total Dibayar",
              right: true,
              render: v => <span className="font-mono">{IDR(v)}</span>,
            },
            {
              key: "start_date",
              label: "Periode",
              render: (v, row) => (
                <span className="text-xs text-gray-400">
                  {DATE(v)} – {DATE(row.end_date)}
                </span>
              ),
            },
            {
              key: "_calc",
              label: "Beban/Bln",
              right: true,
              render: c => <span className="font-mono text-blue-700">{IDR(c.monthly)}</span>,
            },
            {
              key: "_calc",
              label: "Saldo Sisa",
              right: true,
              render: c => (
                <span className={`font-mono font-bold ${c.remaining > 0 ? "text-teal-400" : "text-green-700"}`}>
                  {IDR(c.remaining)}
                </span>
              ),
            },
            {
              key: "_calc",
              label: "Status",
              render: c => (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusBadgeClass(c.status)}`}>
                  {c.status === "Active"  ? "Aktif"   :
                   c.status === "Paid"    ? "Selesai" :
                   c.status === "Overdue" ? "Kedaluwarsa" : "Menunggu"}
                </span>
              ),
            },
          ]}
          empty="Tidak ada entri ditemukan"
        />
      </Card>

      {/* Detail Modal */}
      {selected && (
        <BiayaDetailModal
          entry={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* New Entry Modal */}
      {showAdd && (
        <NewEntryModal
          onClose={() => setShowAdd(false)}
          onSave={handleAddSave}
          entries={entries}
        />
      )}
    </div>
  );
}
