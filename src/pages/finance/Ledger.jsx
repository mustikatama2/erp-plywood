import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, KPICard, SearchBar, Modal, FormField, toast } from "../../components/ui";
import { IDR, exportCSV } from "../../lib/fmt";
import { ACCOUNTS } from "../../data/seed";
import { useJournal } from "../../contexts/JournalContext";

// ── Type badge colours ────────────────────────────────────────────────────────
const TYPE_COLORS = {
  AR:          "bg-blue-500/10 text-blue-700",
  AP:          "bg-amber-500/10 text-amber-700",
  PAYMENT_IN:  "bg-green-500/10 text-green-700",
  PAYMENT_OUT: "bg-red-500/10 text-red-700",
  PAYROLL:     "bg-purple-500/10 text-purple-700",
  INVENTORY:   "bg-cyan-500/10 text-cyan-700",
  MANUAL:      "bg-gray-500/10 text-gray-500",
};

function TypeBadge({ type }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${TYPE_COLORS[type] || TYPE_COLORS.MANUAL}`}>
      {type}
    </span>
  );
}

// ── Manual Entry Modal ────────────────────────────────────────────────────────
const EMPTY_LINE = () => ({ acc: "", debit: "", credit: "" });

function ManualEntryModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    desc: "",
  });
  const [lines, setLines] = useState([EMPTY_LINE(), EMPTY_LINE()]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const accounts = ACCOUNTS.filter(a => !a.is_header);

  const updateLine = (i, k, v) =>
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine    = () => setLines(ls => [...ls, EMPTY_LINE()]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const totalDebit  = lines.reduce((s, l) => s + (Number(l.debit)  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const balanced    = Math.abs(totalDebit - totalCredit) < 1;

  const handleSave = () => {
    if (!form.date) return toast("Tanggal wajib diisi", "error");
    if (!form.desc.trim()) return toast("Deskripsi wajib diisi", "error");
    if (lines.some(l => !l.acc)) return toast("Semua baris harus memilih akun", "error");
    if (!balanced) return toast(`Debit ≠ Credit (selisih: ${IDR(Math.abs(totalDebit - totalCredit))})`, "error");
    const accMap = {};
    ACCOUNTS.forEach(a => { accMap[a.code] = a.name; });
    onSave({
      date: form.date,
      desc: form.desc,
      ref_type: "MANUAL",
      ref_id: `manual-${Date.now()}`,
      bl_no: null,
      so_id: null,
      lines: lines.map(l => ({
        acc:    l.acc,
        name:   accMap[l.acc] || l.acc,
        debit:  Number(l.debit)  || 0,
        credit: Number(l.credit) || 0,
      })),
    });
    toast("✅ Jurnal manual berhasil diposting", "success");
    onClose();
  };

  return (
    <Modal title="+ Manual Journal Entry" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal" required>
            <input type="date" className="erp-input w-full" value={form.date}
              onChange={e => set("date", e.target.value)} />
          </FormField>
          <FormField label="Nomor JE">
            <input className="erp-input w-full bg-gray-50 text-gray-500 font-mono" readOnly
              placeholder="Auto-assigned on save" />
          </FormField>
        </div>

        <FormField label="Deskripsi" required>
          <input className="erp-input w-full" placeholder="Keterangan jurnal…"
            value={form.desc} onChange={e => set("desc", e.target.value)} />
        </FormField>

        {/* Lines */}
        <div>
          <div className="grid grid-cols-12 gap-2 mb-1 text-xs text-gray-500 font-medium uppercase tracking-wider px-1">
            <span className="col-span-5">Akun</span>
            <span className="col-span-3 text-right">Debit</span>
            <span className="col-span-3 text-right">Credit</span>
            <span className="col-span-1"></span>
          </div>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <select className="erp-input w-full text-sm" value={line.acc}
                    onChange={e => updateLine(i, "acc", e.target.value)}>
                    <option value="">— Pilih Akun —</option>
                    {accounts.map(a => (
                      <option key={a.code} value={a.code}>{a.code} · {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input type="number" className="erp-input w-full text-right text-sm" placeholder="0"
                    value={line.debit} onChange={e => updateLine(i, "debit", e.target.value)} />
                </div>
                <div className="col-span-3">
                  <input type="number" className="erp-input w-full text-right text-sm" placeholder="0"
                    value={line.credit} onChange={e => updateLine(i, "credit", e.target.value)} />
                </div>
                <div className="col-span-1 text-center">
                  {lines.length > 2 && (
                    <button onClick={() => removeLine(i)}
                      className="text-red-400 hover:text-red-600 text-lg font-bold">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-4">
            <Btn variant="secondary" size="xs" onClick={addLine}>+ Tambah Baris</Btn>
            <div className={`text-xs font-bold ml-auto ${balanced ? "text-green-700" : "text-red-700"}`}>
              {balanced ? "✅ Balanced" : `⚠ Selisih ${IDR(Math.abs(totalDebit - totalCredit))}`}
            </div>
          </div>
          {/* Totals */}
          <div className="grid grid-cols-12 gap-2 mt-2 border-t border-gray-200 pt-2">
            <div className="col-span-5 text-right text-xs font-bold text-gray-500 pr-2 self-center">Total</div>
            <div className="col-span-3 text-right font-mono font-bold text-green-700 text-sm px-2.5">{IDR(totalDebit)}</div>
            <div className="col-span-3 text-right font-mono font-bold text-red-700 text-sm px-2.5">{IDR(totalCredit)}</div>
            <div className="col-span-1"></div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave} disabled={!balanced}>💾 Post Jurnal</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Ledger ───────────────────────────────────────────────────────────────
const REF_TYPES = ["All", "AR", "AP", "PAYMENT_IN", "PAYMENT_OUT", "PAYROLL", "INVENTORY", "MANUAL"];

export default function Ledger() {
  const journal = useJournal();
  const { entries, postManual } = journal;

  const [search,    setSearch]    = useState("");
  const [typeFilter,setTypeFilter]= useState("All");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [expanded,  setExpanded]  = useState(null);
  const [showManual,setShowManual]= useState(false);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (typeFilter !== "All" && e.ref_type !== typeFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo   && e.date > dateTo)   return false;
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        (e.id   || "").toLowerCase().includes(q) ||
        (e.desc || "").toLowerCase().includes(q) ||
        (e.bl_no || "").toLowerCase().includes(q) ||
        (e.so_id || "").toLowerCase().includes(q)
      );
    });
  }, [entries, search, typeFilter, dateFrom, dateTo]);

  // KPI calculations
  const totalRevenue = useMemo(() =>
    entries.flatMap(e => e.lines)
      .filter(l => l.acc.startsWith("4"))
      .reduce((s, l) => s + l.credit, 0),
  [entries]);

  const totalExpense = useMemo(() =>
    entries.flatMap(e => e.lines)
      .filter(l => l.acc.startsWith("5") || l.acc.startsWith("6"))
      .reduce((s, l) => s + l.debit, 0),
  [entries]);

  const handleManualSave = (entry) => {
    postManual(entry);
  };

  const handleExport = () => {
    const rows = filtered.map(e => ({
      "JE No":       e.id,
      "Date":        e.date,
      "Description": e.desc,
      "Type":        e.ref_type,
      "Ref ID":      e.ref_id,
      "B/L No":      e.bl_no || "",
      "SO Ref":      e.so_id || "",
      "Total Debit": e.lines.reduce((s, l) => s + l.debit, 0),
      "Posted":      e.posted ? "Yes" : "No",
    }));
    exportCSV(rows, "general_ledger.csv");
  };

  return (
    <div>
      <PageHeader title="General Ledger" subtitle={`${entries.length} journal entries`}
        actions={
          <>
            <Btn variant="secondary" onClick={handleExport}>📤 Export CSV</Btn>
            <Btn onClick={() => setShowManual(true)}>+ Manual Entry</Btn>
          </>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <KPICard label="Total Entries"         value={entries.length}     icon="📒" />
        <KPICard label="Total Revenue Posted"  value={IDR(totalRevenue)}  icon="📈" color="text-green-700" />
        <KPICard label="Total Expense Posted"  value={IDR(totalExpense)}  icon="📉" color="text-red-700"   />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <SearchBar value={search} onChange={setSearch}
            placeholder="Search JE no, description, B/L, SO…" />
          <input type="date" className="erp-input text-sm" value={dateFrom}
            onChange={e => setDateFrom(e.target.value)} title="From date" />
          <span className="text-gray-400 text-xs">→</span>
          <input type="date" className="erp-input text-sm" value={dateTo}
            onChange={e => setDateTo(e.target.value)} title="To date" />
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {REF_TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}>
              {t}
              <span className="ml-1 opacity-70">
                {t === "All" ? filtered.length : entries.filter(e => e.ref_type === t).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <table className="erp-table">
          <thead>
            <tr>
              <th>Entry No</th>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th className="text-right">Total Debit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">No journal entries found</td>
              </tr>
            )}
            {filtered.map(e => {
              const tot = e.lines.reduce((s, l) => s + l.debit, 0);
              const isOpen = expanded === e.id;
              return (
                <>
                  <tr key={e.id} className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpanded(isOpen ? null : e.id)}>
                    <td>
                      <span className="font-mono font-bold text-blue-700">{e.id}</span>
                    </td>
                    <td className="text-gray-400 text-xs">{e.date}</td>
                    <td>
                      <span>{e.desc}</span>
                      {(e.bl_no && e.bl_no !== "—") && (
                        <span className="ml-2 text-xs font-mono text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                          B/L: {e.bl_no}
                        </span>
                      )}
                      {e.so_id && (
                        <span className="ml-1 text-xs font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          {e.so_id}
                        </span>
                      )}
                    </td>
                    <td><TypeBadge type={e.ref_type} /></td>
                    <td className="text-right font-mono">{IDR(tot)}</td>
                    <td>
                      <span className="text-xs font-bold text-green-700 bg-green-500/10 px-2 py-0.5 rounded">
                        Posted
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${e.id}-lines`} className="bg-gray-50/80">
                      <td colSpan={6} className="px-6 py-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-400 font-medium uppercase tracking-wider border-b border-gray-200">
                              <th className="pb-1 text-left">Account</th>
                              <th className="pb-1 text-left">Account Name</th>
                              <th className="pb-1 text-right">Debit</th>
                              <th className="pb-1 text-right">Credit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {e.lines.map((l, i) => (
                              <tr key={i} className="border-b border-gray-100 last:border-0">
                                <td className="py-1 font-mono text-blue-700">{l.acc}</td>
                                <td className="py-1">{l.name}</td>
                                <td className="py-1 text-right font-mono text-green-700">
                                  {l.debit > 0 ? IDR(l.debit) : "—"}
                                </td>
                                <td className="py-1 text-right font-mono text-red-700">
                                  {l.credit > 0 ? IDR(l.credit) : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-black text-gray-700 border-t border-gray-300">
                              <td colSpan={2} className="py-1.5">Total</td>
                              <td className="py-1.5 text-right font-mono text-green-700">
                                {IDR(e.lines.reduce((s, l) => s + l.debit, 0))}
                              </td>
                              <td className="py-1.5 text-right font-mono text-red-700">
                                {IDR(e.lines.reduce((s, l) => s + l.credit, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </Card>

      {showManual && (
        <ManualEntryModal
          onClose={() => setShowManual(false)}
          onSave={handleManualSave}
        />
      )}
    </div>
  );
}
