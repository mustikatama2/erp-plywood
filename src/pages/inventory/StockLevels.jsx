import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, KPICard, Modal, FormField, toast } from "../../components/ui";
import { IDR, NUM, DATE } from "../../lib/fmt";
import { PRODUCTS, WAREHOUSES } from "../../data/seed";

// ── Mutation types ────────────────────────────────────────────────────────────
const MUT_TYPES = [
  { id: "produksi",    label: "Produksi / Transformasi", icon: "⚙️",  color: "text-purple-700", bgColor: "bg-purple-50 border-purple-200",
    desc: "Ubah bahan baku menjadi produk jadi (misal: Log → Veneer)" },
  { id: "penerimaan",  label: "Penerimaan (Masuk)",       icon: "📥",  color: "text-green-700",  bgColor: "bg-green-50 border-green-200",
    desc: "Barang masuk dari pembelian atau transfer" },
  { id: "pengiriman",  label: "Pengiriman (Keluar)",      icon: "📤",  color: "text-blue-700",   bgColor: "bg-blue-50 border-blue-200",
    desc: "Barang keluar untuk penjualan atau pengiriman" },
  { id: "penyesuaian", label: "Penyesuaian Stok",         icon: "🔧",  color: "text-amber-700",  bgColor: "bg-amber-50 border-amber-200",
    desc: "Koreksi manual setelah stock opname" },
];

// ── New Mutation Modal ────────────────────────────────────────────────────────
function NewMutationModal({ products, onClose, onSave }) {
  const [mutType, setMutType] = useState("produksi");
  const [form, setForm] = useState({
    from_sku: "", from_qty: "", yield_pct: "80",
    to_sku: "", to_qty_override: "",
    sku: "", qty: "", direction: "+", notes: "", date: new Date().toISOString().slice(0, 10),
    ref: "",
  });
  const [saving, setSaving] = useState(false);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  // For production transform — calculate output qty
  const fromQty   = parseFloat(form.from_qty)  || 0;
  const yieldPct  = parseFloat(form.yield_pct) || 0;
  const calcOut   = fromQty * (yieldPct / 100);

  const fromProduct = products.find(p => p.id === form.from_sku);
  const toProduct   = products.find(p => p.id === form.to_sku);
  const anyProduct  = products.find(p => p.id === form.sku);

  const rawMaterials = products.filter(p =>
    p.category === "Raw Material" || p.category === "Chemical" ||
    p.name.toLowerCase().includes("log") || p.name.toLowerCase().includes("veneer") ||
    p.name.toLowerCase().includes("core") || p.name.toLowerCase().includes("glue") ||
    p.name.toLowerCase().includes("resin")
  );
  const finishedGoods = products.filter(p =>
    p.category === "Plywood" || p.name.toLowerCase().includes("plywood") ||
    p.name.toLowerCase().includes("veneer") || p.name.toLowerCase().includes("block")
  );

  const handleSave = async () => {
    if (mutType === "produksi") {
      if (!form.from_sku) { toast("Pilih bahan input (FROM)", "error"); return; }
      if (!form.from_qty || fromQty <= 0) { toast("Masukkan jumlah input", "error"); return; }
      if (!form.to_sku)   { toast("Pilih produk output (TO)", "error"); return; }
      if (form.from_sku === form.to_sku) { toast("Input dan output tidak boleh sama", "error"); return; }
    } else {
      if (!form.sku) { toast("Pilih SKU produk", "error"); return; }
      const qty = parseFloat(form.qty) || 0;
      if (qty <= 0)  { toast("Masukkan jumlah yang valid", "error"); return; }
    }

    setSaving(true);
    await new Promise(r => setTimeout(r, 700));

    if (mutType === "produksi") {
      const outQty = parseFloat(form.to_qty_override) || calcOut;
      const actualYield = fromQty > 0 ? (outQty / fromQty) * 100 : 0;
      toast(`✅ Produksi dicatat: ${NUM(fromQty)} ${fromProduct?.unit||""} → ${NUM(outQty)} ${toProduct?.unit||""} (${actualYield.toFixed(1)}% yield)`);
      onSave({
        type: "produksi",
        date: form.date,
        from_id: form.from_sku, from_name: fromProduct?.name, from_qty: fromQty,
        to_id: form.to_sku,   to_name: toProduct?.name,   to_qty: outQty,
        yield_pct: actualYield, notes: form.notes, ref: form.ref,
      });
    } else {
      const qty = parseFloat(form.qty);
      const sign = mutType === "penerimaan" ? 1 : mutType === "pengiriman" ? -1 : (form.direction === "+" ? 1 : -1);
      toast(`✅ Mutasi ${mutType} dicatat: ${sign > 0 ? "+" : ""}${NUM(qty)} ${anyProduct?.unit||""}`);
      onSave({
        type: mutType,
        date: form.date,
        sku_id: form.sku, sku_name: anyProduct?.name,
        qty: qty * sign, notes: form.notes, ref: form.ref,
      });
    }
    onClose();
  };

  const curType = MUT_TYPES.find(t => t.id === mutType);

  return (
    <Modal title="📝 Catat Mutasi Stok" subtitle="Pergerakan barang masuk, keluar, atau transformasi produksi" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">

        {/* Type selector */}
        <div>
          <label className="erp-label">Jenis Mutasi</label>
          <div className="grid grid-cols-2 gap-2">
            {MUT_TYPES.map(t => (
              <button key={t.id} onClick={() => setMutType(t.id)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                  mutType === t.id
                    ? `${t.bgColor} ring-2 ring-offset-1 ring-brand-gold`
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}>
                <span className="text-xl leading-none mt-0.5">{t.icon}</span>
                <div>
                  <p className={`text-xs font-bold ${mutType === t.id ? t.color : "text-gray-700"}`}>{t.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date + Ref */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tanggal" required>
            <input type="date" value={form.date} onChange={set("date")} className="erp-input" />
          </FormField>
          <FormField label="No. Referensi / Batch">
            <input value={form.ref} onChange={set("ref")} className="erp-input"
              placeholder="Misal: PO-001, WO-025, atau kosong" />
          </FormField>
        </div>

        {/* ─── PRODUKSI (Transform) ─────────────────────────────────────── */}
        {mutType === "produksi" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              {/* FROM */}
              <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide">📥 INPUT (Bahan Baku)</p>
                <FormField label="Pilih Material Input" required>
                  <select value={form.from_sku} onChange={set("from_sku")} className="erp-input">
                    <option value="">-- Pilih SKU --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name} (stok: {NUM(p.stock_qty)} {p.unit})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Jumlah Input" required>
                  <div className="flex items-center gap-2">
                    <input type="number" value={form.from_qty} onChange={set("from_qty")} className="erp-input"
                      placeholder="0.00" min="0" step="0.01" />
                    {fromProduct && <span className="text-sm text-gray-500 flex-shrink-0">{fromProduct.unit}</span>}
                  </div>
                  {fromProduct && fromQty > 0 && fromQty > fromProduct.stock_qty && (
                    <p className="text-xs text-red-600 mt-1">⚠️ Melebihi stok ({NUM(fromProduct.stock_qty)})</p>
                  )}
                </FormField>
              </div>

              {/* TO */}
              <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide">📤 OUTPUT (Produk Jadi)</p>
                <FormField label="Pilih Produk Output" required>
                  <select value={form.to_sku} onChange={set("to_sku")} className="erp-input">
                    <option value="">-- Pilih SKU --</option>
                    {products.filter(p => p.id !== form.from_sku).map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.code}] {p.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Jumlah Output" required={false}>
                  <div className="flex items-center gap-2">
                    <input type="number" value={form.to_qty_override} onChange={set("to_qty_override")} className="erp-input"
                      placeholder={calcOut > 0 ? calcOut.toFixed(2) : "auto"} min="0" step="0.01" />
                    {toProduct && <span className="text-sm text-gray-500 flex-shrink-0">{toProduct.unit}</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Kosongkan = pakai kalkulasi yield</p>
                </FormField>
              </div>
            </div>

            {/* Yield % control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="erp-label mb-0">Yield / Rendemen (%)</label>
                <span className="text-lg font-black text-purple-700">{yieldPct}%</span>
              </div>
              <input type="range" min="0" max="100" step="0.5"
                value={form.yield_pct}
                onChange={set("yield_pct")}
                className="w-full h-2 rounded-full cursor-pointer"
                style={{ accentColor: '#7C3AED' }}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
              <div className="mt-1">
                <input type="number" value={form.yield_pct} onChange={set("yield_pct")}
                  className="erp-input w-24 text-center" min="0" max="100" step="0.1"
                  placeholder="80" />
                <span className="text-sm text-gray-500 ml-2">% (ketik manual)</span>
              </div>
            </div>

            {/* Live preview */}
            {fromQty > 0 && yieldPct > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-3">⚙️ Kalkulasi Transformasi</p>
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex-1 bg-white border border-red-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Input</p>
                    <p className="text-xl font-black text-red-700">{NUM(fromQty, 2)}</p>
                    <p className="text-xs text-gray-500">{fromProduct?.unit || "unit"}</p>
                    {fromProduct && <p className="text-xs text-gray-400 mt-1 truncate">{fromProduct.name}</p>}
                  </div>
                  <div className="text-center flex-shrink-0">
                    <p className="text-xs text-purple-600 font-bold">×</p>
                    <p className="text-lg font-black text-purple-700">{yieldPct}%</p>
                    <p className="text-xs text-purple-500">yield</p>
                    <p className="text-xl">→</p>
                  </div>
                  <div className="flex-1 bg-white border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Output</p>
                    <p className="text-xl font-black text-green-700">
                      {NUM(parseFloat(form.to_qty_override) || calcOut, 2)}
                    </p>
                    <p className="text-xs text-gray-500">{toProduct?.unit || "unit"}</p>
                    {toProduct && <p className="text-xs text-gray-400 mt-1 truncate">{toProduct.name}</p>}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Susut/Loss: <span className="font-bold text-red-600">{NUM(fromQty - (parseFloat(form.to_qty_override) || calcOut), 2)} {fromProduct?.unit || ""}</span>
                  {" "}({(100 - yieldPct).toFixed(1)}%)
                </p>
              </div>
            )}
          </>
        )}

        {/* ─── PENERIMAAN / PENGIRIMAN / PENYESUAIAN ────────────────────── */}
        {mutType !== "produksi" && (
          <>
            <FormField label="Produk / SKU" required>
              <select value={form.sku} onChange={set("sku")} className="erp-input">
                <option value="">-- Pilih Produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} (stok: {NUM(p.stock_qty)} {p.unit})
                  </option>
                ))}
              </select>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Jumlah" required>
                <div className="flex items-center gap-2">
                  <input type="number" value={form.qty} onChange={set("qty")} className="erp-input"
                    placeholder="0.00" min="0" step="0.01" />
                  {anyProduct && <span className="text-sm text-gray-500 flex-shrink-0">{anyProduct.unit}</span>}
                </div>
              </FormField>
              {mutType === "penyesuaian" && (
                <FormField label="Arah Koreksi">
                  <select value={form.direction} onChange={set("direction")} className="erp-input">
                    <option value="+">+ Tambah stok</option>
                    <option value="-">− Kurangi stok</option>
                  </select>
                </FormField>
              )}
            </div>
          </>
        )}

        <FormField label="Catatan">
          <textarea value={form.notes} onChange={set("notes")} className="erp-input min-h-[60px]"
            placeholder={mutType === "produksi"
              ? "Misal: Batch WO-025, operator Budi, shift 1"
              : "Catatan tambahan…"} />
        </FormField>

        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : `${curType?.icon} Catat Mutasi`}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Stock bar ─────────────────────────────────────────────────────────────────
function StockBar({ qty, reorder }) {
  const pct    = Math.min(100, (qty / (reorder * 3)) * 100);
  const isLow  = qty < reorder;
  const color  = isLow ? "bg-red-500" : pct > 60 ? "bg-green-500" : "bg-amber-500";
  return (
    <div className="mt-1.5">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-auto">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function StockLevels() {
  const [showMutation, setShowMutation]   = useState(false);
  const [mutations, setMutations]         = useState([]);
  const [stockAdj, setStockAdj]           = useState({});   // { sku_id: delta }
  const [filter, setFilter]               = useState("All");

  // Apply local adjustments on top of seed data
  const products = useMemo(() => PRODUCTS.map(p => ({
    ...p,
    stock_qty: (p.stock_qty || 0) + (stockAdj[p.id] || 0),
  })), [stockAdj]);

  const plywood  = products.filter(p => p.category === "Plywood");
  const raw      = products.filter(p => p.category === "Raw Material" || p.category === "Chemical");
  const allItems = filter === "Finished" ? plywood : filter === "Raw" ? raw : [...plywood, ...raw];

  const totalValue = products.reduce((s, p) => s + (p.stock_qty || 0) * (p.price_idr || 0), 0);
  const lowStock   = products.filter(p => p.stock_qty < p.reorder).length;

  const handleMutation = (mut) => {
    setMutations(prev => [mut, ...prev]);
    if (mut.type === "produksi") {
      setStockAdj(prev => ({
        ...prev,
        [mut.from_id]: (prev[mut.from_id] || 0) - mut.from_qty,
        [mut.to_id]:   (prev[mut.to_id]   || 0) + mut.to_qty,
      }));
    } else if (mut.sku_id) {
      setStockAdj(prev => ({
        ...prev,
        [mut.sku_id]: (prev[mut.sku_id] || 0) + mut.qty,
      }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Stok Saat Ini"
        subtitle="Inventori · Gudang Utama"
        actions={
          <Btn onClick={() => setShowMutation(true)}>
            📝 Catat Mutasi
          </Btn>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total SKU"         value={PRODUCTS.length}    icon="📦" accent="kpi-blue" />
        <KPICard label="Nilai Inventori"   value={IDR(totalValue)}    icon="💰" color="text-green-700" accent="kpi-green" />
        <KPICard label="Stok Menipis"      value={lowStock}           icon="⚠️"
          color={lowStock > 0 ? "text-red-700" : "text-gray-900"} accent={lowStock > 0 ? "kpi-red" : "kpi-blue"} />
        <KPICard label="Mutasi Hari Ini"   value={mutations.length}   icon="🔄" color="text-purple-700" accent="kpi-blue" />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {[["All", "Semua"], ["Finished", "🪵 Produk Jadi"], ["Raw", "🧪 Bahan Baku"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              filter === k ? "bg-brand-dark text-brand-gold" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>{l}</button>
        ))}
      </div>

      {/* Stock table */}
      <div className="erp-card mb-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Produk / SKU</th>
                <th>Kode</th>
                <th className="text-right">Stok Qty</th>
                <th className="text-right">Reorder Point</th>
                <th>Status</th>
                <th className="text-right">Nilai (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map(p => {
                const isLow = p.stock_qty < p.reorder;
                return (
                  <tr key={p.id}>
                    <td>
                      <p className="font-semibold text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.spec}</p>
                    </td>
                    <td><span className="font-mono text-xs text-blue-700">{p.code}</span></td>
                    <td className="text-right">
                      <span className={`font-black text-base ${isLow ? "text-red-700" : "text-gray-900"}`}>
                        {NUM(p.stock_qty)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">{p.unit}</span>
                      <StockBar qty={p.stock_qty} reorder={p.reorder} />
                    </td>
                    <td className="text-right text-gray-500">{NUM(p.reorder)}</td>
                    <td>
                      {isLow
                        ? <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">⚠️ Menipis</span>
                        : <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">✅ Normal</span>
                      }
                    </td>
                    <td className="text-right font-mono text-sm">
                      {p.price_idr ? IDR(p.stock_qty * p.price_idr) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mutation log */}
      {mutations.length > 0 && (
        <Card title="📋 Log Mutasi — Sesi Ini" subtitle="Pergerakan stok yang baru dicatat">
          <div className="space-y-2">
            {mutations.map((m, i) => {
              const typeInfo = MUT_TYPES.find(t => t.id === m.type);
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${typeInfo?.bgColor || "bg-gray-50 border-gray-200"}`}>
                  <span className="text-xl flex-shrink-0">{typeInfo?.icon}</span>
                  <div className="flex-1 min-w-0">
                    {m.type === "produksi" ? (
                      <>
                        <p className="font-semibold text-gray-900">
                          {m.from_name} → {m.to_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {NUM(m.from_qty)} input · {NUM(m.to_qty)} output ·
                          <span className="font-bold text-purple-700"> {m.yield_pct.toFixed(1)}% yield</span>
                          {m.ref ? ` · Ref: ${m.ref}` : ""}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-900">{m.sku_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.qty > 0 ? "+" : ""}{NUM(m.qty)} ·
                          <span className={`font-bold ml-1 ${typeInfo?.color}`}>{typeInfo?.label}</span>
                          {m.ref ? ` · Ref: ${m.ref}` : ""}
                        </p>
                      </>
                    )}
                    {m.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{m.notes}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{DATE(m.date)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {showMutation && (
        <NewMutationModal
          products={products}
          onClose={() => setShowMutation(false)}
          onSave={handleMutation}
        />
      )}
    </div>
  );
}
