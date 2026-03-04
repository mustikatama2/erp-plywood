/**
 * Semi-Actual Costing Module
 *
 * Method:
 *   - Direct Materials (DM):  Actual qty consumed × Actual price  → ACTUAL cost
 *   - Direct Labor (DL):      Actual hours worked × Standard rate → STANDARD cost applied
 *   - Factory Overhead (FOH): Standard rate × Actual output volume → STANDARD cost applied
 *   - Month-end: Compare applied vs actual costs → compute variances, post adj. entry
 *
 * Variances tracked:
 *   DM:  Price Variance (MPV) + Quantity Variance (MQV)
 *   DL:  Rate Variance (LRV)  + Efficiency Variance (LEV)
 *   FOH: Spending Variance + Efficiency Variance + Volume Variance
 */

import { useState } from "react";
import { PageHeader, Card, Btn, KPICard, Modal, toast, FormField } from "../../components/ui";
import { IDR, PCT, NUM } from "../../lib/fmt";
import { PRODUCTS } from "../../data/seed";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const TT = { contentStyle: { background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }, labelStyle: { color: "#f3f4f6" } };

// ── Standard Cost Cards (per product/batch) ───────────────────────────────────
const STANDARD_COSTS = [
  {
    id: "sc001", product_id: "p001", product_name: "Plywood 18mm (2440×1220)",
    batch_size: 1000, // sheets per batch
    dm: [
      { material: "Core Veneer Meranti", std_qty: 0.025, unit: "m3", std_price: 950000 },
      { material: "Face Veneer Sungkai",  std_qty: 0.004, unit: "m3", std_price: 2200000 },
      { material: "Glue / Resin UF",      std_qty: 1.8,   unit: "kg", std_price: 18000   },
    ],
    dl: [
      { dept: "Gluing & Assembly", std_hours: 2.5, std_rate: 45000 },
      { dept: "Hot Press",         std_hours: 0.8, std_rate: 52000 },
      { dept: "Sanding & Finishing",std_hours: 1.2, std_rate: 40000 },
    ],
    foh_rate_per_sheet: 8500, // standard FOH per sheet output
  },
  {
    id: "sc002", product_id: "p002", product_name: "Plywood 12mm (2440×1220)",
    batch_size: 1000,
    dm: [
      { material: "Core Veneer Meranti", std_qty: 0.018, unit: "m3", std_price: 950000 },
      { material: "Face Veneer Sungkai",  std_qty: 0.003, unit: "m3", std_price: 2200000 },
      { material: "Glue / Resin UF",      std_qty: 1.4,   unit: "kg", std_price: 18000   },
    ],
    dl: [
      { dept: "Gluing & Assembly", std_hours: 2.0, std_rate: 45000 },
      { dept: "Hot Press",         std_hours: 0.7, std_rate: 52000 },
      { dept: "Sanding & Finishing",std_hours: 1.0, std_rate: 40000 },
    ],
    foh_rate_per_sheet: 7200,
  },
];

// ── Production Batches (this month) ──────────────────────────────────────────
const BATCHES = [
  {
    id: "PB-2026-0312", date: "2026-03-05", product_id: "p001", product_name: "Plywood 18mm",
    std_card_id: "sc001",
    actual_output: 950, // sheets produced
    // DM Actuals
    dm_actual: [
      { material: "Core Veneer Meranti", actual_qty: 0.0258, unit: "m3", actual_price: 960000 },
      { material: "Face Veneer Sungkai",  actual_qty: 0.0043, unit: "m3", actual_price: 2250000 },
      { material: "Glue / Resin UF",      actual_qty: 1.85,   unit: "kg", actual_price: 17500   },
    ],
    // DL Actuals
    dl_actual: [
      { dept: "Gluing & Assembly",  actual_hours: 2.8, actual_rate: 45000 },
      { dept: "Hot Press",          actual_hours: 0.9, actual_rate: 52000 },
      { dept: "Sanding & Finishing",actual_hours: 1.3, actual_rate: 40000 },
    ],
    // FOH
    actual_foh: 8400000, // total actual FOH this batch
    status: "completed",
  },
  {
    id: "PB-2026-0318", date: "2026-03-12", product_id: "p002", product_name: "Plywood 12mm",
    std_card_id: "sc002",
    actual_output: 1100,
    dm_actual: [
      { material: "Core Veneer Meranti", actual_qty: 0.0175, unit: "m3", actual_price: 945000 },
      { material: "Face Veneer Sungkai",  actual_qty: 0.0029, unit: "m3", actual_price: 2180000 },
      { material: "Glue / Resin UF",      actual_qty: 1.35,   unit: "kg", actual_price: 18200   },
    ],
    dl_actual: [
      { dept: "Gluing & Assembly",  actual_hours: 1.9, actual_rate: 45000 },
      { dept: "Hot Press",          actual_hours: 0.65,actual_rate: 52000 },
      { dept: "Sanding & Finishing",actual_hours: 0.95,actual_rate: 40000 },
    ],
    actual_foh: 7900000,
    status: "completed",
  },
];

// ── Variance Calculations ─────────────────────────────────────────────────────
function calcVariances(batch) {
  const sc = STANDARD_COSTS.find(s => s.id === batch.std_card_id);
  if (!sc) return null;

  const qty = batch.actual_output;

  // DM variances
  const dmVarItems = batch.dm_actual.map((actual, i) => {
    const std = sc.dm[i];
    if (!std) return null;
    const stdCostPerSheet = std.std_qty * std.std_price;
    const actCostPerSheet = actual.actual_qty * actual.actual_price;
    // Price variance = (Actual Price - Std Price) × Actual Qty × Output
    const priceVar = (actual.actual_price - std.std_price) * actual.actual_qty * qty;
    // Qty variance = (Actual Qty - Std Qty) × Std Price × Output
    const qtyVar   = (actual.actual_qty - std.std_qty) * std.std_price * qty;
    return {
      material: actual.material,
      stdCost: stdCostPerSheet * qty,
      actCost: actCostPerSheet * qty,
      priceVar,
      qtyVar,
      totalVar: priceVar + qtyVar,
    };
  }).filter(Boolean);

  const totalDMStd = dmVarItems.reduce((s, v) => s + v.stdCost, 0);
  const totalDMActual = dmVarItems.reduce((s, v) => s + v.actCost, 0);
  const totalDMVar = dmVarItems.reduce((s, v) => s + v.totalVar, 0);

  // DL variances
  const dlVarItems = batch.dl_actual.map((actual, i) => {
    const std = sc.dl[i];
    if (!std) return null;
    const stdCost = std.std_hours * std.std_rate * qty;
    const actCost = actual.actual_hours * actual.actual_rate * qty;
    // Rate variance = (Actual Rate - Std Rate) × Actual Hours
    const rateVar = (actual.actual_rate - std.std_rate) * actual.actual_hours * qty;
    // Efficiency variance = (Actual Hours - Std Hours) × Std Rate
    const effVar  = (actual.actual_hours - std.std_hours) * std.std_rate * qty;
    return { dept: actual.dept, stdCost, actCost, rateVar, effVar, totalVar: rateVar + effVar };
  }).filter(Boolean);

  const totalDLStd    = dlVarItems.reduce((s, v) => s + v.stdCost, 0);
  const totalDLActual = dlVarItems.reduce((s, v) => s + v.actCost, 0);
  const totalDLVar    = dlVarItems.reduce((s, v) => s + v.totalVar, 0);

  // FOH variances
  const stdFOH    = sc.foh_rate_per_sheet * qty;
  const actFOH    = batch.actual_foh;
  const fohVar    = actFOH - stdFOH; // positive = unfavorable (over-spent)

  // Totals
  const totalStd    = totalDMStd + totalDLStd + stdFOH;
  const totalActual = totalDMActual + totalDLActual + actFOH;
  const totalVar    = totalDMVar + totalDLVar + fohVar;

  return {
    batch, sc, qty,
    dm:  { items: dmVarItems,  totalStd: totalDMStd,  totalActual: totalDMActual, totalVar: totalDMVar },
    dl:  { items: dlVarItems,  totalStd: totalDLStd,  totalActual: totalDLActual, totalVar: totalDLVar },
    foh: { std: stdFOH, actual: actFOH, var: fohVar },
    totals: { std: totalStd, actual: totalActual, var: totalVar },
  };
}

// ── Variance card component ────────────────────────────────────────────────────
function VarAmount({ amount, reverse = false }) {
  // Unfavorable = positive (spent more than standard)
  const isFav = reverse ? amount > 0 : amount < 0;
  return (
    <span className={`font-mono font-bold text-xs ${isFav ? "text-green-700" : "text-red-700"}`}>
      {amount >= 0 ? "+" : ""}{IDR(amount)}
      <span className="ml-1 font-normal">{isFav ? "F" : "U"}</span>
    </span>
  );
}

function BatchVarianceDetail({ result, onClose }) {
  if (!result) return null;
  const { dm, dl, foh, totals, batch, qty } = result;

  return (
    <Modal title={`Analisis Varians — ${batch.id}`}
      subtitle={`${batch.product_name} · ${qty.toLocaleString()} lembar · ${batch.date}`}
      onClose={onClose} width="max-w-3xl">
      <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["Biaya Standar", totals.std, "text-blue-700"],
            ["Biaya Aktual",  totals.actual, "text-gray-900"],
            ["Total Varians", totals.var, totals.var>0?"text-red-700":"text-green-700"]
          ].map(([l, v, c]) => (
            <div key={l} className="erp-card p-3">
              <p className="text-xs text-gray-500 mb-1">{l}</p>
              <p className={`text-lg font-black ${c}`}>{IDR(v)}</p>
            </div>
          ))}
        </div>

        {/* DM Section */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            🪵 Direct Materials (Aktual)
            <span className={`text-xs font-normal ${dm.totalVar>0?"text-red-700":"text-green-700"}`}>
              Varians: <VarAmount amount={-dm.totalVar} />
            </span>
          </h4>
          <table className="erp-table text-xs">
            <thead><tr><th>Material</th><th className="text-right">Biaya Std</th><th className="text-right">Biaya Aktual</th><th className="text-right">Var Harga</th><th className="text-right">Var Kuantitas</th><th className="text-right">Total Var</th></tr></thead>
            <tbody>
              {dm.items.map(item => (
                <tr key={item.material}>
                  <td className="text-gray-900">{item.material}</td>
                  <td className="text-right font-mono text-blue-700">{IDR(item.stdCost)}</td>
                  <td className="text-right font-mono">{IDR(item.actCost)}</td>
                  <td className="text-right"><VarAmount amount={-item.priceVar} /></td>
                  <td className="text-right"><VarAmount amount={-item.qtyVar} /></td>
                  <td className="text-right"><VarAmount amount={-item.totalVar} /></td>
                </tr>
              ))}
              <tr className="font-black">
                <td>Total DM</td>
                <td className="text-right font-mono text-blue-700">{IDR(dm.totalStd)}</td>
                <td className="text-right font-mono text-gray-900">{IDR(dm.totalActual)}</td>
                <td /><td />
                <td className="text-right"><VarAmount amount={-dm.totalVar} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DL Section */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            👷 Direct Labor (Standar Rate)
            <span className="text-xs font-normal text-gray-500">Rate: standar · Hours: aktual</span>
          </h4>
          <table className="erp-table text-xs">
            <thead><tr><th>Departemen</th><th className="text-right">Jam Std</th><th className="text-right">Jam Aktual</th><th className="text-right">Var Rate</th><th className="text-right">Var Efisiensi</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {dl.items.map(item => (
                <tr key={item.dept}>
                  <td className="text-gray-900">{item.dept}</td>
                  <td className="text-right font-mono">{IDR(item.stdCost)}</td>
                  <td className="text-right font-mono">{IDR(item.actCost)}</td>
                  <td className="text-right"><VarAmount amount={-item.rateVar} /></td>
                  <td className="text-right"><VarAmount amount={-item.effVar} /></td>
                  <td className="text-right"><VarAmount amount={-item.totalVar} /></td>
                </tr>
              ))}
              <tr className="font-black">
                <td>Total DL</td>
                <td className="text-right font-mono text-blue-700">{IDR(dl.totalStd)}</td>
                <td className="text-right font-mono text-gray-900">{IDR(dl.totalActual)}</td>
                <td /><td />
                <td className="text-right"><VarAmount amount={-dl.totalVar} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* FOH Section */}
        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            🏭 Factory Overhead (Standar Rate)
            <span className="text-xs font-normal text-gray-500">Tarif × Aktual Output</span>
          </h4>
          <table className="erp-table text-xs">
            <thead><tr><th>Item</th><th className="text-right">Standar</th><th className="text-right">Aktual</th><th className="text-right">Varians</th></tr></thead>
            <tbody>
              <tr>
                <td className="text-gray-900">Factory Overhead</td>
                <td className="text-right font-mono text-blue-700">{IDR(foh.std)}</td>
                <td className="text-right font-mono">{IDR(foh.actual)}</td>
                <td className="text-right"><VarAmount amount={-foh.var} /></td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mt-1">
            Tarif standar × output aktual ({NUM(qty)} × {IDR(result.sc.foh_rate_per_sheet)}/lembar)
          </p>
        </div>

        {/* Journal entry suggestion */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-300 mb-2">📒 Jurnal Penyesuaian Varians (Akhir Bulan)</p>
          <div className="font-mono text-xs space-y-1 text-gray-700">
            {totals.var > 0 ? (
              <>
                <div>Dr. Variance — Unfavorable &nbsp;&nbsp;{IDR(Math.abs(totals.var))}</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;Cr. Work in Process &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{IDR(Math.abs(totals.var))}</div>
              </>
            ) : (
              <>
                <div>Dr. Work in Process &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{IDR(Math.abs(totals.var))}</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;Cr. Variance — Favorable &nbsp;&nbsp;{IDR(Math.abs(totals.var))}</div>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
          <Btn onClick={() => { toast("✅ Jurnal varians berhasil dicatat"); onClose(); }}>
            📒 Catat Jurnal
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function Costing() {
  const [tab, setTab] = useState("batches");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const selectedResult = selectedBatch ? calcVariances(selectedBatch) : null;

  const allResults = BATCHES.map(calcVariances).filter(Boolean);

  // Chart data for variance summary
  const chartData = allResults.map(r => ({
    name: r.batch.id.slice(-6),
    dm:  Math.round(-r.dm.totalVar / 1000),
    dl:  Math.round(-r.dl.totalVar / 1000),
    foh: Math.round(-r.foh.var / 1000),
  }));

  const totalStd    = allResults.reduce((s, r) => s + r.totals.std, 0);
  const totalActual = allResults.reduce((s, r) => s + r.totals.actual, 0);
  const totalVar    = allResults.reduce((s, r) => s + r.totals.var, 0);

  return (
    <div>
      <PageHeader title="Biaya Produksi (Semi-Actual)" subtitle="DM: Aktual · DL & FOH: Standar · Rekonsiliasi Akhir Bulan" />

      <div className="mb-4 p-3 rounded-xl text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="font-bold text-gray-900 mb-1.5">Metode Semi-Actual Costing</p>
        <div className="grid grid-cols-3 gap-3 text-gray-400">
          <div><span className="text-green-700 font-bold">DM (Bahan Baku):</span> Kuantitas aktual × harga aktual = BIAYA AKTUAL</div>
          <div><span className="text-blue-700 font-bold">DL (Tenaga Kerja):</span> Jam aktual × tarif standar = STANDAR DITERAPKAN</div>
          <div><span className="text-amber-700 font-bold">FOH (Overhead):</span> Tarif standar × output aktual = STANDAR DITERAPKAN</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Biaya Standar"  sublabel="Standard Cost"   value={IDR(totalStd)}    color="text-blue-700"  icon="📋" />
        <KPICard label="Total Biaya Aktual"   sublabel="Actual Cost"     value={IDR(totalActual)} color="text-gray-900"     icon="💸" />
        <KPICard label="Total Varians"        sublabel="Total Variance"  value={IDR(Math.abs(totalVar))}
          color={totalVar > 0 ? "text-red-700" : "text-green-700"} icon={totalVar > 0 ? "⚠️" : "✅"}
          sub={totalVar > 0 ? "Unfavorable (lebih mahal)" : "Favorable (lebih hemat)"} />
        <KPICard label="Batch Selesai"        sublabel="Completed"       value={BATCHES.filter(b=>b.status==="completed").length} icon="🏭" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-gray-200 pb-0">
        {[["batches","🏭 Batch Produksi"],["standards","📋 Kartu Biaya Standar"],["variance","📊 Ringkasan Varians"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab===k?"border-yellow-400 text-gray-900":"border-transparent text-gray-500 hover:text-gray-700"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Batches tab */}
      {tab === "batches" && (
        <Card>
          <table className="erp-table">
            <thead>
              <tr>
                <th>No. Batch</th><th>Tanggal</th><th>Produk</th><th className="text-right">Output</th>
                <th className="text-right">Biaya Std</th><th className="text-right">Biaya Aktual</th>
                <th className="text-right">Varians</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {allResults.map(r => (
                <tr key={r.batch.id}>
                  <td className="font-mono text-blue-700 text-xs">{r.batch.id}</td>
                  <td className="text-xs">{r.batch.date}</td>
                  <td className="font-medium text-gray-900">{r.batch.product_name}</td>
                  <td className="text-right font-mono">{NUM(r.qty)} lbr</td>
                  <td className="text-right font-mono text-blue-700 text-xs">{IDR(r.totals.std)}</td>
                  <td className="text-right font-mono text-xs">{IDR(r.totals.actual)}</td>
                  <td className="text-right">
                    <span className={`text-xs font-bold ${r.totals.var > 0 ? "text-red-700" : "text-green-700"}`}>
                      {r.totals.var >= 0 ? "+" : ""}{IDR(r.totals.var)}
                      <span className="ml-1 opacity-70">{r.totals.var > 0 ? "U" : "F"}</span>
                    </span>
                  </td>
                  <td><span className="text-xs text-green-700">✅ Selesai</span></td>
                  <td>
                    <Btn size="xs" variant="ghost" onClick={() => setSelectedBatch(r.batch)}>
                      📊 Analisis
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Standard cost cards tab */}
      {tab === "standards" && (
        <div className="space-y-4">
          {STANDARD_COSTS.map(sc => {
            const totalDMStd = sc.dm.reduce((s, d) => s + d.std_qty * d.std_price * sc.batch_size, 0);
            const totalDLStd = sc.dl.reduce((s, d) => s + d.std_hours * d.std_rate * sc.batch_size, 0);
            const totalFOH   = sc.foh_rate_per_sheet * sc.batch_size;
            const totalCost  = totalDMStd + totalDLStd + totalFOH;
            const costPerUnit = totalCost / sc.batch_size;

            return (
              <Card key={sc.id} title={sc.product_name} subtitle={`Per batch ${NUM(sc.batch_size)} lembar · Biaya per lembar: ${IDR(costPerUnit)}`}>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  {/* DM */}
                  <div>
                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">🪵 Direct Materials</p>
                    <table className="erp-table text-xs">
                      <thead><tr><th>Material</th><th>Std Qty</th><th className="text-right">Biaya/batch</th></tr></thead>
                      <tbody>
                        {sc.dm.map(d => (
                          <tr key={d.material}>
                            <td>{d.material}</td>
                            <td className="font-mono">{d.std_qty} {d.unit}</td>
                            <td className="text-right font-mono">{IDR(d.std_qty * d.std_price * sc.batch_size)}</td>
                          </tr>
                        ))}
                        <tr className="font-bold"><td colSpan={2}>Subtotal DM</td><td className="text-right">{IDR(totalDMStd)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  {/* DL */}
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">👷 Direct Labor</p>
                    <table className="erp-table text-xs">
                      <thead><tr><th>Departemen</th><th>Jam</th><th className="text-right">Biaya</th></tr></thead>
                      <tbody>
                        {sc.dl.map(d => (
                          <tr key={d.dept}>
                            <td>{d.dept}</td>
                            <td className="font-mono">{d.std_hours} jam</td>
                            <td className="text-right font-mono">{IDR(d.std_hours * d.std_rate * sc.batch_size)}</td>
                          </tr>
                        ))}
                        <tr className="font-bold"><td colSpan={2}>Subtotal DL</td><td className="text-right">{IDR(totalDLStd)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                  {/* FOH + Summary */}
                  <div>
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">🏭 Overhead Pabrik</p>
                    <div className="erp-card p-3 text-sm space-y-2">
                      <div className="flex justify-between"><span className="text-gray-400">Tarif/lembar</span><span className="font-mono">{IDR(sc.foh_rate_per_sheet)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Total FOH/batch</span><span className="font-mono text-amber-700">{IDR(totalFOH)}</span></div>
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex justify-between"><span className="font-bold">Total Cost/batch</span><span className="font-black text-gray-900">{IDR(totalCost)}</span></div>
                        <div className="flex justify-between mt-1"><span className="text-gray-400">Per lembar</span><span className="font-bold text-green-700">{IDR(costPerUnit)}</span></div>
                      </div>
                    </div>
                    {/* Cost breakdown donut-like bar */}
                    <div className="mt-3 space-y-1.5 text-xs">
                      {[["DM",totalDMStd,"bg-green-500"],["DL",totalDLStd,"bg-blue-500"],["FOH",totalFOH,"bg-amber-500"]].map(([l,v,c])=>(
                        <div key={l} className="flex items-center gap-2">
                          <span className="w-8 text-gray-500">{l}</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-100">
                            <div className={`h-2 rounded-full ${c}`} style={{width:`${Math.round(v/totalCost*100)}%`}} />
                          </div>
                          <span className="text-gray-400 w-8 text-right">{Math.round(v/totalCost*100)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Variance summary tab */}
      {tab === "variance" && (
        <div className="space-y-4">
          <Card title="Ringkasan Varians per Batch (Rp 000)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickFormatter={v => `${v}k`} />
                <Tooltip {...TT} formatter={v => [`Rp ${v}k`, ""]} />
                <Bar dataKey="dm"  name="DM Variance"  fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="dl"  name="DL Variance"  fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="foh" name="FOH Variance" fill="#f59e0b" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 text-center mt-1">Positif = Favorable (lebih hemat dari standar)</p>
          </Card>

          <Card title="Detail Varians — Akhir Bulan">
            <table className="erp-table">
              <thead>
                <tr><th>Batch</th><th>Produk</th><th className="text-right">Var DM</th><th className="text-right">Var DL</th><th className="text-right">Var FOH</th><th className="text-right">Total Varians</th><th className="text-right">% dari Standar</th></tr>
              </thead>
              <tbody>
                {allResults.map(r => (
                  <tr key={r.batch.id}>
                    <td className="font-mono text-xs text-blue-700">{r.batch.id}</td>
                    <td className="text-gray-900">{r.batch.product_name}</td>
                    <td className="text-right"><VarAmount amount={-r.dm.totalVar} /></td>
                    <td className="text-right"><VarAmount amount={-r.dl.totalVar} /></td>
                    <td className="text-right"><VarAmount amount={-r.foh.var} /></td>
                    <td className="text-right">
                      <span className={`font-black text-sm ${r.totals.var > 0 ? "text-red-700" : "text-green-700"}`}>
                        {IDR(Math.abs(r.totals.var))} {r.totals.var > 0 ? "U" : "F"}
                      </span>
                    </td>
                    <td className="text-right">
                      <span className={`text-xs ${Math.abs(r.totals.var / r.totals.std) > 0.05 ? "text-red-700" : "text-green-700"}`}>
                        {PCT(Math.abs(r.totals.var / r.totals.std) * 100)}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="font-black border-t-2 border-gray-200">
                  <td colSpan={2}>TOTAL</td>
                  <td className="text-right"><VarAmount amount={-allResults.reduce((s,r)=>s+r.dm.totalVar,0)} /></td>
                  <td className="text-right"><VarAmount amount={-allResults.reduce((s,r)=>s+r.dl.totalVar,0)} /></td>
                  <td className="text-right"><VarAmount amount={-allResults.reduce((s,r)=>s+r.foh.var,0)} /></td>
                  <td className="text-right">
                    <span className={`font-black ${totalVar > 0 ? "text-red-700" : "text-green-700"}`}>
                      {IDR(Math.abs(totalVar))} {totalVar > 0 ? "U" : "F"}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="text-xs">{PCT(Math.abs(totalVar / totalStd) * 100)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
              <Btn variant="secondary">📤 Export Variance Report</Btn>
              <Btn onClick={() => toast("✅ Jurnal varians bulan ini berhasil dicatat")}>
                📒 Catat Semua Jurnal Varians
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {/* Batch variance detail modal */}
      {selectedBatch && (
        <BatchVarianceDetail result={selectedResult} onClose={() => setSelectedBatch(null)} />
      )}
    </div>
  );
}
