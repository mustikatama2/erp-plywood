/**
 * Inventory Report — Laporan Kartu Stok per SKU
 * Shows opening balance, all movements (IN/OUT/ADJ), closing balance
 * per product for a selected period. Exportable.
 */
import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, KPICard, SearchBar } from "../../components/ui";
import { NUM, IDR, DATE, exportCSV } from "../../lib/fmt";
import { PRODUCTS } from "../../data/seed";

// ── Months available ──────────────────────────────────────────────────────────
const MONTHS = [
  { label: "Jan 2026", value: "2026-01" },
  { label: "Feb 2026", value: "2026-02" },
  { label: "Mar 2026", value: "2026-03" },
];

// ── Simulated movement data per product per month ─────────────────────────────
function generateStockCard(productId, month) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return [];

  const [year, mon] = month.split("-").map(Number);
  const seed = (productId.charCodeAt(productId.length - 1) + mon) % 7;
  const baseQty = product.stock_qty;

  const entries = [];
  let balance = Math.round(baseQty * 0.85 + seed * 20);

  // Opening
  entries.push({ date: `${month}-01`, type: "OPENING", ref: "SALDO AWAL", description: "Saldo Awal Periode", qty_in: balance, qty_out: 0, balance });

  // Receipts (IN)
  const receipts = [
    { day: 3,  ref: `GR-${year}-${String(mon).padStart(2,'0')}01`, desc: "Penerimaan dari PO", qty: Math.round(120 + seed * 30) },
    { day: 14, ref: `GR-${year}-${String(mon).padStart(2,'0')}02`, desc: "Penerimaan dari PO", qty: Math.round(85 + seed * 15)  },
  ];
  const issues = [
    { day: 5,  ref: `SO-${year}-${String(mon).padStart(2,'0')}01`, desc: "Pengiriman ke Customer", qty: Math.round(90 + seed * 25) },
    { day: 10, ref: `SO-${year}-${String(mon).padStart(2,'0')}02`, desc: "Pengiriman ke Customer", qty: Math.round(110 + seed * 20) },
    { day: 20, ref: `SO-${year}-${String(mon).padStart(2,'0')}03`, desc: "Pengiriman ke Customer", qty: Math.round(75 + seed * 10) },
  ];
  const adj = { day: 25, ref: `ADJ-${year}-${String(mon).padStart(2,'0')}01`, desc: "Penyesuaian Stock Opname", qty: (seed % 2 === 0 ? 1 : -1) * (seed + 3) };

  const allEvents = [
    ...receipts.map(r => ({ ...r, type: "IN" })),
    ...issues.map(i => ({ ...i, type: "OUT" })),
    { ...adj, type: "ADJ" },
  ].sort((a, b) => a.day - b.day);

  for (const e of allEvents) {
    const date = `${month}-${String(e.day).padStart(2, '0')}`;
    if (e.type === "IN") {
      balance += e.qty;
      entries.push({ date, type: "IN", ref: e.ref, description: e.desc, qty_in: e.qty, qty_out: 0, qty_adj: 0, balance });
    } else if (e.type === "OUT") {
      balance = Math.max(0, balance - e.qty);
      entries.push({ date, type: "OUT", ref: e.ref, description: e.desc, qty_in: 0, qty_out: e.qty, qty_adj: 0, balance });
    } else {
      balance += e.qty;
      entries.push({ date, type: "ADJ", ref: e.ref, description: e.desc, qty_in: 0, qty_out: 0, qty_adj: e.qty, balance });
    }
  }

  return entries;
}

const TYPE_STYLE = {
  OPENING: { label: "Saldo Awal", color: "text-blue-400",  bg: "bg-blue-500/10" },
  IN:      { label: "Masuk",      color: "text-green-400", bg: "bg-green-500/10" },
  OUT:     { label: "Keluar",     color: "text-red-400",   bg: "bg-red-500/10" },
  ADJ:     { label: "Penyesuaian",color: "text-amber-400", bg: "bg-amber-500/10" },
};

// ── SKU Summary row ───────────────────────────────────────────────────────────
function summarize(entries) {
  const opening = entries.find(e => e.type === "OPENING")?.qty_in || 0;
  const totalIn  = entries.filter(e => e.type === "IN").reduce((s, e) => s + e.qty_in, 0);
  const totalOut = entries.filter(e => e.type === "OUT").reduce((s, e) => s + e.qty_out, 0);
  const totalAdj = entries.filter(e => e.type === "ADJ").reduce((s, e) => s + (e.qty_adj || 0), 0);
  const closing  = entries[entries.length - 1]?.balance || 0;
  return { opening, totalIn, totalOut, totalAdj, closing };
}

export default function InventoryReport() {
  const [month,      setMonth]   = useState("2026-03");
  const [selectedId, setSelected]= useState(null);
  const [search,     setSearch]  = useState("");
  const [catFilter,  setCat]     = useState("All");

  const cats = ["All", ...new Set(PRODUCTS.map(p => p.category))];

  const products = useMemo(() =>
    PRODUCTS.filter(p =>
      (catFilter === "All" || p.category === catFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()))
    ), [catFilter, search]
  );

  const summaries = useMemo(() =>
    products.map(p => {
      const entries = generateStockCard(p.id, month);
      const sum = summarize(entries);
      return { ...p, ...sum, entries };
    }), [products, month]
  );

  const selected = summaries.find(s => s.id === selectedId);
  const selectedEntries = selected?.entries || [];

  // Aggregates
  const totalIn  = summaries.reduce((s, r) => s + r.totalIn, 0);
  const totalOut = summaries.reduce((s, r) => s + r.totalOut, 0);
  const lowStock = summaries.filter(s => s.closing < (s.reorder || 0)).length;

  const handleExport = () => {
    if (selected) {
      exportCSV(selectedEntries.map(e => ({
        Tanggal: e.date, Tipe: TYPE_STYLE[e.type]?.label, Referensi: e.ref,
        Deskripsi: e.description, Masuk: e.qty_in || "", Keluar: e.qty_out || "",
        Penyesuaian: e.qty_adj || "", Saldo: e.balance,
      })), `kartu-stok-${selected.name.replace(/\s+/g,'-')}-${month}`);
    } else {
      exportCSV(summaries.map(s => ({
        Produk: s.name, Kategori: s.category, "Saldo Awal": s.opening,
        "Total Masuk": s.totalIn, "Total Keluar": s.totalOut,
        "Penyesuaian": s.totalAdj, "Saldo Akhir": s.closing, Satuan: s.unit,
      })), `laporan-stok-${month}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Laporan Stok (Kartu Stok)"
        subtitle="Per-SKU stock card — opening, movements, closing balance"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={handleExport}>📤 Export CSV</Btn>
          </div>
        }
      />

      {/* Period + filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap p-3 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Periode:</span>
          <div className="flex gap-1">
            {MONTHS.map(m => (
              <button key={m.value} onClick={() => setMonth(m.value)}
                className="px-3 py-1.5 text-xs rounded-lg font-medium transition-colors"
                style={month === m.value
                  ? { background: 'var(--gold)', color: '#1A1C14', fontWeight: 700 }
                  : { background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Cari produk…" />
        <div className="flex gap-1 flex-wrap">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${catFilter===c?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total SKU"       sublabel="Products tracked" value={summaries.length}               icon="🗂️" />
        <KPICard label="Total Masuk"     sublabel="Receipts this month"  value={`+${NUM(totalIn)}`}  color="text-green-400" icon="📦" />
        <KPICard label="Total Keluar"    sublabel="Issues this month"    value={`-${NUM(totalOut)}`} color="text-red-400"   icon="📤" />
        <KPICard label="Stok Rendah"     sublabel="Below reorder point"  value={lowStock}            color={lowStock>0?"text-red-400":"text-green-400"} icon="⚠️" />
      </div>

      <div className={`grid gap-4 ${selected ? "md:grid-cols-[1fr_1.5fr]" : "grid-cols-1"}`}>
        {/* Summary table */}
        <Card title="Ringkasan Stok per SKU" subtitle={`Periode: ${MONTHS.find(m=>m.value===month)?.label}`}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th className="text-right">Awal</th>
                <th className="text-right">Masuk</th>
                <th className="text-right">Keluar</th>
                <th className="text-right">Adj</th>
                <th className="text-right">Akhir</th>
                <th>Sat.</th>
              </tr>
            </thead>
            <tbody>
              {summaries.map(s => {
                const isLow = s.closing < (s.reorder || 0);
                const isSelected = s.id === selectedId;
                return (
                  <tr key={s.id}
                    onClick={() => setSelected(isSelected ? null : s.id)}
                    className="cursor-pointer"
                    style={isSelected ? { background: 'rgba(240,194,0,0.08)' } : {}}>
                    <td>
                      <div>
                        <p className={`font-semibold text-sm ${isSelected ? "text-yellow-400" : "text-white"}`}>{s.name}</p>
                        <p className="text-xs text-gray-600">{s.category}</p>
                      </div>
                    </td>
                    <td className="text-right font-mono text-gray-400 text-xs">{NUM(s.opening)}</td>
                    <td className="text-right font-mono text-green-400 text-xs">{s.totalIn > 0 ? `+${NUM(s.totalIn)}` : "—"}</td>
                    <td className="text-right font-mono text-red-400 text-xs">{s.totalOut > 0 ? `-${NUM(s.totalOut)}` : "—"}</td>
                    <td className="text-right font-mono text-amber-400 text-xs">{s.totalAdj !== 0 ? (s.totalAdj > 0 ? `+${s.totalAdj}` : s.totalAdj) : "—"}</td>
                    <td className="text-right">
                      <span className={`font-black text-sm ${isLow ? "text-red-400" : "text-white"}`}>
                        {NUM(s.closing)}{isLow ? " ⚠️" : ""}
                      </span>
                    </td>
                    <td className="text-xs text-gray-600">{s.unit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {/* Kartu Stok detail — shows when a product is selected */}
        {selected && (
          <Card
            title={`Kartu Stok: ${selected.name}`}
            subtitle={MONTHS.find(m=>m.value===month)?.label}
            action={
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 text-lg">✕</button>
            }
          >
            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[["Awal",selected.opening,"text-gray-400"],["Masuk",selected.totalIn,"text-green-400"],
                ["Keluar",selected.totalOut,"text-red-400"],["Akhir",selected.closing,"text-white"]].map(([l,v,c])=>(
                <div key={l} className="text-center p-2 rounded-lg" style={{background:'var(--bg-input)'}}>
                  <p className="text-xs text-gray-500">{l}</p>
                  <p className={`font-black text-sm ${c}`}>{NUM(v)}</p>
                </div>
              ))}
            </div>

            {/* Transaction lines */}
            <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
              <table className="erp-table text-xs">
                <thead>
                  <tr><th>Tgl</th><th>Tipe</th><th>Referensi</th><th className="text-right">Masuk</th><th className="text-right">Keluar</th><th className="text-right">Adj</th><th className="text-right">Saldo</th></tr>
                </thead>
                <tbody>
                  {selectedEntries.map((e, i) => {
                    const ts = TYPE_STYLE[e.type];
                    return (
                      <tr key={i} className={i === 0 ? "opacity-60" : ""}>
                        <td className="text-gray-500">{e.date.slice(5)}</td>
                        <td><span className={`font-bold ${ts.color}`}>{ts.label}</span></td>
                        <td className="font-mono text-gray-500">{e.ref}</td>
                        <td className="text-right text-green-400">{e.qty_in  > 0 ? `+${NUM(e.qty_in)}`   : "—"}</td>
                        <td className="text-right text-red-400">{e.qty_out > 0 ? `-${NUM(e.qty_out)}` : "—"}</td>
                        <td className={`text-right ${(e.qty_adj||0)>0?"text-green-400":(e.qty_adj||0)<0?"text-red-400":"text-gray-600"}`}>
                          {(e.qty_adj||0) !== 0 ? ((e.qty_adj>0)?`+${e.qty_adj}`:e.qty_adj) : "—"}
                        </td>
                        <td className="text-right font-black text-white">{NUM(e.balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Btn size="xs" variant="secondary" onClick={handleExport}>📤 Export Kartu Stok</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
