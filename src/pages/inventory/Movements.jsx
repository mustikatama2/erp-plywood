import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, KPICard, SearchBar, Badge, Table } from "../../components/ui";
import { NUM, IDR, DATE, exportCSV } from "../../lib/fmt";
import { PRODUCTS, SALES_ORDERS, PURCHASE_ORDERS } from "../../data/seed";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TT = { contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }, labelStyle: { color: "#f3f4f6" } };

// ── Generate seed movements from SO and PO data ───────────────────────────────
function generateMovements() {
  const moves = [];
  let id = 1;

  // Opening balances (first of current month)
  PRODUCTS.forEach(p => {
    moves.push({
      id: `M${String(id++).padStart(4,"0")}`,
      date: "2026-03-01",
      product_id: p.id,
      product_name: p.name,
      category: p.category,
      unit: p.unit,
      type: "OPENING",
      ref: "OPENING-2026-03",
      description: "Saldo Awal Maret 2026",
      qty_in: p.stock_qty,
      qty_out: 0,
      qty_adj: 0,
      balance: p.stock_qty,
    });
  });

  // SO shipments → stock out
  SALES_ORDERS.filter(s => s.status !== "Cancelled").forEach(so => {
    if (so.lines) {
      so.lines.forEach(line => {
        const prod = PRODUCTS.find(p => p.id === line.product_id);
        if (!prod) return;
        const opening = moves.filter(m => m.product_id === prod.id).reduce((b, m) => b + m.qty_in - m.qty_out, 0);
        moves.push({
          id: `M${String(id++).padStart(4,"0")}`,
          date: so.delivery_date || so.date,
          product_id: prod.id,
          product_name: prod.name,
          category: prod.category,
          unit: prod.unit,
          type: "OUT",
          ref: so.so_no,
          description: `Pengiriman ke customer — ${so.so_no}`,
          qty_in: 0,
          qty_out: line.qty || Math.floor(Math.random() * 500 + 100),
          qty_adj: 0,
          balance: 0, // computed below
        });
      });
    } else {
      // Simulate movement for SOs without line items
      const prod = PRODUCTS[Math.floor(Math.random() * Math.min(4, PRODUCTS.length))];
      if (!prod) return;
      moves.push({
        id: `M${String(id++).padStart(4,"0")}`,
        date: so.delivery_date || so.date,
        product_id: prod.id,
        product_name: prod.name,
        category: prod.category,
        unit: prod.unit,
        type: "OUT",
        ref: so.so_no,
        description: `Pengiriman — ${so.so_no}`,
        qty_in: 0,
        qty_out: Math.floor(Math.random() * 400 + 80),
        qty_adj: 0,
        balance: 0,
      });
    }
  });

  // PO receipts → stock in
  PURCHASE_ORDERS.filter(p => p.status !== "Cancelled").slice(0, 6).forEach(po => {
    const prod = PRODUCTS.find(p => ["Plywood","Raw Material","Blockboard"].includes(p.category));
    if (!prod) return;
    moves.push({
      id: `M${String(id++).padStart(4,"0")}`,
      date: po.date,
      product_id: prod.id,
      product_name: prod.name,
      category: prod.category,
      unit: prod.unit,
      type: "IN",
      ref: po.po_no,
      description: `Penerimaan bahan baku — ${po.po_no}`,
      qty_in: Math.floor(Math.random() * 300 + 50),
      qty_out: 0,
      qty_adj: 0,
      balance: 0,
    });
  });

  // Random adjustments
  const adjReasons = ["Stock Opname", "Koreksi Hitungan", "Barang Rusak / Scrap", "Transfer Antar Gudang"];
  PRODUCTS.slice(0, 3).forEach(prod => {
    moves.push({
      id: `M${String(id++).padStart(4,"0")}`,
      date: "2026-03-10",
      product_id: prod.id,
      product_name: prod.name,
      category: prod.category,
      unit: prod.unit,
      type: "ADJ",
      ref: `ADJ-2026-${String(id).padStart(3,"0")}`,
      description: adjReasons[Math.floor(Math.random() * adjReasons.length)],
      qty_in: 0,
      qty_out: 0,
      qty_adj: (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 30 + 5),
      balance: 0,
    });
  });

  // Compute running balance per product
  const sorted = moves.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const balances = {};
  return sorted.map(m => {
    const prev = balances[m.product_id] || 0;
    const next = prev + m.qty_in - m.qty_out + m.qty_adj;
    balances[m.product_id] = next;
    return { ...m, balance: next };
  });
}

const ALL_MOVES = generateMovements();
const TYPE_LABEL = { OPENING: "Saldo Awal", IN: "Masuk", OUT: "Keluar", ADJ: "Penyesuaian" };
const TYPE_COLOR = { OPENING: "text-blue-400", IN: "text-green-400", OUT: "text-red-400", ADJ: "text-amber-400" };

// ── SKU Summary ───────────────────────────────────────────────────────────────
function skuSummary(moves) {
  const map = {};
  moves.forEach(m => {
    if (!map[m.product_id]) {
      map[m.product_id] = { product_id: m.product_id, name: m.product_name, category: m.category, unit: m.unit, opening: 0, totalIn: 0, totalOut: 0, totalAdj: 0 };
    }
    if (m.type === "OPENING") map[m.product_id].opening += m.qty_in;
    else if (m.type === "IN")   map[m.product_id].totalIn  += m.qty_in;
    else if (m.type === "OUT")  map[m.product_id].totalOut += m.qty_out;
    else if (m.type === "ADJ")  map[m.product_id].totalAdj += m.qty_adj;
  });
  return Object.values(map).map(s => ({
    ...s,
    closing: s.opening + s.totalIn - s.totalOut + s.totalAdj,
  }));
}

export default function Movements() {
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [skuFilter,  setSkuFilter]  = useState("All");
  const [view,       setView]       = useState("sku"); // sku | detail

  const filteredMoves = useMemo(() => ALL_MOVES.filter(m => {
    if (typeFilter !== "All" && m.type !== typeFilter) return false;
    if (skuFilter  !== "All" && m.product_id !== skuFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.product_name.toLowerCase().includes(q) || m.ref.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
    }
    return true;
  }), [typeFilter, skuFilter, search]);

  const summary = useMemo(() => skuSummary(ALL_MOVES), []);
  const filteredSummary = summary.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalIn  = filteredMoves.filter(m => m.type === "IN").reduce((s, m) => s + m.qty_in,  0);
  const totalOut = filteredMoves.filter(m => m.type === "OUT").reduce((s, m) => s + m.qty_out, 0);
  const totalAdj = filteredMoves.filter(m => m.type === "ADJ").reduce((s, m) => s + Math.abs(m.qty_adj), 0);

  // Top 5 by movement for bar chart
  const topSKUs = [...summary].sort((a,b) => (b.totalIn + b.totalOut) - (a.totalIn + a.totalOut)).slice(0,5);

  const handleExport = () => exportCSV(filteredMoves.map(m => ({
    "No": m.id, "Tanggal": m.date, "Produk": m.product_name, "Tipe": TYPE_LABEL[m.type],
    "Referensi": m.ref, "Deskripsi": m.description,
    "Masuk": m.qty_in, "Keluar": m.qty_out, "Adj": m.qty_adj, "Saldo": m.balance, "Satuan": m.unit
  })), "mutasi-stok");

  return (
    <div>
      <PageHeader title="Mutasi Stok" subtitle="Inventory Movement — per SKU · Maret 2026"
        actions={
          <div className="flex gap-2">
            <Btn variant="secondary" onClick={handleExport}>📤 Export CSV</Btn>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Pergerakan"  sublabel="All Movements" value={ALL_MOVES.filter(m=>m.type!=="OPENING").length}    icon="🔄" />
        <KPICard label="Total Masuk"       sublabel="Stock In"      value={`+${totalIn.toLocaleString()}`}      color="text-green-400" icon="📦" />
        <KPICard label="Total Keluar"      sublabel="Stock Out"     value={`-${totalOut.toLocaleString()}`}     color="text-red-400"   icon="📤" />
        <KPICard label="Penyesuaian"       sublabel="Adjustments"   value={totalAdj}                            color="text-amber-400" icon="⚖️" />
      </div>

      {/* Top SKU movement chart */}
      <Card title="Top 5 SKU — Volume Pergerakan (Maret 2026)" className="mb-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={topSKUs.map(s => ({ name: s.name.split(" ").slice(0,3).join(" "), masuk: s.totalIn, keluar: s.totalOut }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
            <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
            <Tooltip {...TT} />
            <Bar dataKey="masuk"  name="Masuk"  fill="#22c55e" radius={[3,3,0,0]} />
            <Bar dataKey="keluar" name="Keluar" fill="#ef4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* View toggle + filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
          {[["sku","📦 Per SKU"],["detail","📋 Detail Transaksi"]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${view===k?"text-gray-950 font-bold":"text-gray-400"}`}
              style={view===k?{background:'var(--gold)'}:{}}>
              {l}
            </button>
          ))}
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Cari produk, referensi…" />

        {view === "detail" && (
          <div className="flex gap-1 flex-wrap">
            {["All","IN","OUT","ADJ","OPENING"].map(t=>(
              <button key={t} onClick={()=>setTypeFilter(t)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${typeFilter===t?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {t==="All"?"Semua":TYPE_LABEL[t]||t}
              </button>
            ))}
          </div>
        )}

        {view === "detail" && (
          <select value={skuFilter} onChange={e=>setSkuFilter(e.target.value)} className="erp-select text-xs py-1.5 w-48">
            <option value="All">Semua Produk</option>
            {PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* SKU Summary View */}
      {view === "sku" && (
        <Card>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Produk</th>
                <th>Kategori</th>
                <th className="text-right">Saldo Awal</th>
                <th className="text-right">Masuk</th>
                <th className="text-right">Keluar</th>
                <th className="text-right">Penyesuaian</th>
                <th className="text-right">Saldo Akhir</th>
                <th>Satuan</th>
              </tr>
            </thead>
            <tbody>
              {filteredSummary.map(s => {
                const prod = PRODUCTS.find(p => p.id === s.product_id);
                const isLow = s.closing < (prod?.reorder || 0);
                return (
                  <tr key={s.product_id}
                    className="cursor-pointer"
                    onClick={() => { setSkuFilter(s.product_id); setView("detail"); }}>
                    <td className="font-semibold text-white">{s.name}</td>
                    <td><span className="text-xs text-gray-500">{s.category}</span></td>
                    <td className="text-right font-mono text-gray-400">{NUM(s.opening)}</td>
                    <td className="text-right font-mono text-green-400">{s.totalIn > 0 ? `+${NUM(s.totalIn)}` : "—"}</td>
                    <td className="text-right font-mono text-red-400">{s.totalOut > 0 ? `-${NUM(s.totalOut)}` : "—"}</td>
                    <td className="text-right font-mono text-amber-400">{s.totalAdj !== 0 ? (s.totalAdj > 0 ? `+${NUM(s.totalAdj)}` : NUM(s.totalAdj)) : "—"}</td>
                    <td className={`text-right font-black ${isLow ? "text-red-400" : "text-white"}`}>
                      {NUM(s.closing)} {isLow && "⚠️"}
                    </td>
                    <td><span className="text-xs text-gray-600">{s.unit}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Detail Transactions View */}
      {view === "detail" && (
        <Card subtitle={`${filteredMoves.length} transaksi`}>
          <table className="erp-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Tanggal</th>
                <th>Produk</th>
                <th>Tipe</th>
                <th>Referensi</th>
                <th>Deskripsi</th>
                <th className="text-right">Masuk</th>
                <th className="text-right">Keluar</th>
                <th className="text-right">Adj</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {filteredMoves.map(m => (
                <tr key={m.id}>
                  <td className="font-mono text-xs text-blue-400">{m.id}</td>
                  <td className="text-xs">{DATE(m.date)}</td>
                  <td className="text-white font-medium">{m.product_name}</td>
                  <td>
                    <span className={`text-xs font-bold ${TYPE_COLOR[m.type]}`}>{TYPE_LABEL[m.type]}</span>
                  </td>
                  <td className="font-mono text-xs text-gray-500">{m.ref}</td>
                  <td className="text-xs text-gray-400 max-w-xs truncate">{m.description}</td>
                  <td className="text-right font-mono text-green-400">{m.qty_in > 0  ? `+${NUM(m.qty_in)}`  : "—"}</td>
                  <td className="text-right font-mono text-red-400">{m.qty_out > 0 ? `-${NUM(m.qty_out)}` : "—"}</td>
                  <td className={`text-right font-mono ${m.qty_adj > 0 ? "text-green-400" : m.qty_adj < 0 ? "text-red-400" : "text-gray-600"}`}>
                    {m.qty_adj !== 0 ? (m.qty_adj > 0 ? `+${m.qty_adj}` : m.qty_adj) : "—"}
                  </td>
                  <td className="text-right font-black text-white">{NUM(m.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
