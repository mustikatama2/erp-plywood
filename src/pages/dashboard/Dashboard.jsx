import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { KPICard, Card, QuickActions, Tip, StatRow } from "../../components/ui";
import { IDR, DATE, badge, PCT } from "../../lib/fmt";
import { CUSTOMERS, AR_INVOICES, AP_INVOICES, SALES_ORDERS, BANK_ACCOUNTS, EMPLOYEES, PNL_MONTHLY, BALANCE_SHEET, PRODUCTS } from "../../data/seed";
import AnomalyPanel from "../../components/ai/AnomalyPanel";
import CashFlowForecast from "../../components/ai/CashFlowForecast";

const TT = { contentStyle:{ background:"#111827", border:"1px solid #374151", borderRadius:8 }, labelStyle:{color:"#f3f4f6"} };

export default function Dashboard() {
  const navigate = useNavigate();
  const FX = 15560;

  const totalAR    = AR_INVOICES.reduce((s,i) => s + i.balance * (i.currency==="USD"?FX:1), 0);
  const totalAP    = AP_INVOICES.reduce((s,i) => s + i.balance, 0);
  const overdueAR  = AR_INVOICES.filter(i => i.status === "Overdue");
  const overdueAP  = AP_INVOICES.filter(i => i.status === "Overdue");
  const openSO     = SALES_ORDERS.filter(s => !["Shipped","Cancelled"].includes(s.status));
  const totalCash  = BANK_ACCOUNTS.reduce((s,b) => s + (b.currency==="USD"?b.balance*FX:b.balance), 0);
  const cur        = PNL_MONTHLY[PNL_MONTHLY.length-1];
  const prev       = PNL_MONTHLY[PNL_MONTHLY.length-2];
  const revTrend   = ((cur.revenue - prev.revenue) / prev.revenue) * 100;
  const lowStock   = PRODUCTS.filter(p => p.stock_qty < p.reorder);

  const revenueChart = PNL_MONTHLY.map(m => ({
    bulan: m.month.split(" ")[0],
    Pendapatan: Math.round(m.revenue/1e6),
    "Laba Kotor": Math.round(m.gross/1e6),
    "Laba Bersih": Math.round(m.net/1e6),
  }));

  return (
    <div className="space-y-5">

      {/* ── Alert banner ── */}
      {(overdueAR.length > 0 || overdueAP.length > 0 || lowStock.length > 0) && (
        <div className="space-y-2">
          {overdueAR.length > 0 && (
            <button onClick={() => navigate("/finance/ar")} className="w-full text-left bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 hover:bg-red-500/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="text-sm font-bold text-red-300">Piutang Jatuh Tempo (Overdue AR)</p>
                    <p className="text-xs text-red-400">{overdueAR.length} invoice belum dibayar · Total {IDR(overdueAR.reduce((s,i)=>s+i.balance*(i.currency==="USD"?FX:1),0))}</p>
                  </div>
                </div>
                <span className="text-red-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          )}
          {overdueAP.length > 0 && (
            <button onClick={() => navigate("/finance/ap")} className="w-full text-left bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 hover:bg-amber-500/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-bold text-amber-300">Tagihan Vendor Jatuh Tempo</p>
                    <p className="text-xs text-amber-400">{overdueAP.length} tagihan belum dibayar · {IDR(overdueAP.reduce((s,i)=>s+i.balance,0))}</p>
                  </div>
                </div>
                <span className="text-amber-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          )}
          {lowStock.length > 0 && (
            <button onClick={() => navigate("/inventory/stock")} className="w-full text-left bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 hover:bg-blue-500/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📦</span>
                  <div>
                    <p className="text-sm font-bold text-blue-300">Stok Hampir Habis</p>
                    <p className="text-xs text-blue-400">{lowStock.length} produk di bawah batas reorder · {lowStock.map(p=>p.name.split(" ").slice(0,2).join(" ")).join(", ")}</p>
                  </div>
                </div>
                <span className="text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <QuickActions actions={[
        { icon:"📄", label:"Buat Sales Order", sublabel:"Order dari customer baru", onClick:()=>navigate("/sales/orders") },
        { icon:"📋", label:"Buat Proforma",    sublabel:"Kirim penawaran harga",    onClick:()=>navigate("/sales/proforma") },
        { icon:"💰", label:"Catat Pembayaran", sublabel:"Terima bayaran customer",  onClick:()=>navigate("/finance/ar") },
        { icon:"📈", label:"Laporan Keuangan", sublabel:"P&L, Neraca, Rasio",       onClick:()=>navigate("/finance/reports") },
      ]} />

      {/* ── AI Anomaly Panel ── */}
      <div className="erp-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <h3 className="text-sm font-bold text-white">Deteksi Anomali AI</h3>
              <p className="text-xs text-gray-500">Smart alerts · diperbarui otomatis</p>
            </div>
          </div>
          <button onClick={() => navigate("/ai")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Buka Asisten AI →
          </button>
        </div>
        <AnomalyPanel compact={true} />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Pendapatan Bulan Ini" sublabel="Revenue" value={IDR(cur.revenue)} color="text-green-400" icon="💰" trend={revTrend} />
        <KPICard label="Laba Kotor"           sublabel="Gross Profit" value={IDR(cur.gross)}   color="text-blue-400"  icon="📈" sub={`Margin ${PCT(cur.gross/cur.revenue*100)}`} />
        <KPICard label="Laba Bersih"          sublabel="Net Income"   value={IDR(cur.net)}     color="text-purple-400"icon="🎯" sub={`NPM ${PCT(cur.net/cur.revenue*100)}`} />
        <KPICard label="Total Kas & Bank"     sublabel="Cash & Bank"  value={IDR(totalCash)}   color="text-teal-400"  icon="🏦" sub={`${BANK_ACCOUNTS.length} rekening`} />
        <KPICard label="Piutang Belum Terima" sublabel="AR Outstanding" value={IDR(totalAR)} color={overdueAR.length?"text-red-400":"text-white"} icon="📤"
          sub={`${AR_INVOICES.filter(i=>i.status!=="Paid").length} invoice terbuka`} />
        <KPICard label="Hutang Belum Bayar"   sublabel="AP Outstanding" value={IDR(totalAP)} color={overdueAP.length?"text-amber-400":"text-white"} icon="📥"
          sub={`${AP_INVOICES.filter(i=>i.status!=="Paid").length} tagihan terbuka`} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card title="Pendapatan & Laba 6 Bulan Terakhir" subtitle="dalam Rp Juta">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="bulan" tick={{fill:"#9ca3af",fontSize:11}} />
                <YAxis tick={{fill:"#9ca3af",fontSize:11}} />
                <Tooltip {...TT} formatter={v=>[`Rp ${v}jt`]} />
                <Bar dataKey="Pendapatan"   fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="Laba Kotor"   fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="Laba Bersih"  fill="#a855f7" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Posisi Keuangan" subtitle="Balance Sheet — hari ini">
          <div className="space-y-1 text-sm">
            <p className="text-xs text-gray-600 uppercase tracking-wider font-bold mb-2">Aset</p>
            <StatRow label="Kas & Bank"    value={IDR(BALANCE_SHEET.assets.cash)}      color="text-teal-400" />
            <StatRow label="Piutang"  sublabel="AR" value={IDR(BALANCE_SHEET.assets.ar)}   color="text-amber-300" />
            <StatRow label="Stok / Inventori"         value={IDR(BALANCE_SHEET.assets.inventory)} />
            <StatRow label="Aset Tetap (net)"         value={IDR(BALANCE_SHEET.assets.fixed_net)} />
            <StatRow label="Total Aset" value={IDR(Object.values(BALANCE_SHEET.assets).reduce((a,b)=>a+b,0))} color="text-green-400" border={false} />
            <div className="border-t border-gray-700 my-2"/>
            <StatRow label="Total Ekuitas" sublabel="Equity" value={IDR(Object.values(BALANCE_SHEET.equity).reduce((a,b)=>a+b,0))} color="text-blue-400" border={false} />
          </div>
        </Card>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Open Sales Orders */}
        <Card title={`Order Aktif (${openSO.length})`} subtitle="Sales orders belum selesai">
          {openSO.length === 0 ? (
            <p className="text-center py-6 text-gray-500">Tidak ada order aktif</p>
          ) : (
            <div className="space-y-2">
              {openSO.map(so => {
                const cust = CUSTOMERS.find(c=>c.id===so.customer_id);
                return (
                  <button key={so.id} onClick={()=>navigate("/sales/orders")}
                    className="w-full flex items-center justify-between py-2.5 border-b border-gray-800/50 text-xs hover:bg-gray-800/30 rounded px-1 transition-colors group">
                    <div className="text-left">
                      <p className="font-bold text-white group-hover:text-blue-300">{so.so_no}</p>
                      <p className="text-gray-500">{cust?.name.split(" ").slice(0,3).join(" ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white">{so.currency} {so.total.toLocaleString()}</p>
                      <span className={badge(so.status)}>{so.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* AR Aging */}
        <Card title="Umur Piutang" subtitle="AR Aging — siapa yang perlu ditagih">
          {[
            { label:"Belum Jatuh Tempo", sublabel:"Current ≤ 30 hari", items:AR_INVOICES.filter(i=>i.status==="Unpaid"), color:"text-green-400", dot:"🟢" },
            { label:"Dibayar Sebagian",  sublabel:"Partial payment",    items:AR_INVOICES.filter(i=>i.status==="Partial"), color:"text-amber-400", dot:"🟡" },
            { label:"Sudah Jatuh Tempo", sublabel:"Overdue > 60 hari",  items:AR_INVOICES.filter(i=>i.status==="Overdue"), color:"text-red-400",   dot:"🔴" },
          ].map(({label,sublabel,items,color,dot})=>(
            <button key={label} onClick={()=>navigate("/finance/ar")}
              className="w-full flex items-center justify-between py-2.5 border-b border-gray-800/50 text-sm hover:bg-gray-800/30 rounded px-1 transition-colors">
              <div className="text-left">
                <p className="font-medium text-white flex items-center gap-1.5">{dot} {label}</p>
                <p className="text-xs text-gray-500">{sublabel} · {items.length} invoice</p>
              </div>
              <span className={`font-black ${color}`}>
                {IDR(items.reduce((s,i)=>s+i.balance*(i.currency==="USD"?FX:1),0))}
              </span>
            </button>
          ))}
        </Card>

        {/* Stok & Info */}
        <Card title="Stok Produk" subtitle="Produk utama — level stok hari ini">
          <div className="space-y-3">
            {PRODUCTS.filter(p=>p.category==="Plywood").slice(0,4).map(p => (
              <button key={p.id} onClick={()=>navigate("/inventory/stock")}
                className="w-full flex items-center gap-3 py-1.5 hover:bg-gray-800/30 rounded px-1 transition-colors group">
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-300 group-hover:text-white">{p.name}</p>
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${p.stock_qty<p.reorder?"bg-red-500":"bg-blue-500"}`}
                      style={{width:`${Math.min(100,(p.stock_qty/(p.reorder*3))*100)}%`}} />
                  </div>
                </div>
                <span className={`text-sm font-black w-20 text-right flex-shrink-0 ${p.stock_qty<p.reorder?"text-red-400":"text-gray-300"}`}>
                  {p.stock_qty.toLocaleString()} {p.stock_qty<p.reorder?"⚠️":""}
                </span>
              </button>
            ))}
            <div className="border-t border-gray-800 pt-3 grid grid-cols-2 gap-2 text-center">
              <div className="erp-card p-2">
                <p className="text-lg font-black text-white">{EMPLOYEES.length}</p>
                <p className="text-xs text-gray-500">Karyawan</p>
              </div>
              <div className="erp-card p-2">
                <p className="text-lg font-black text-white">{BANK_ACCOUNTS.length}</p>
                <p className="text-xs text-gray-500">Rekening Bank</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── AI Cash Flow Forecast ── */}
      <div className="erp-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <div>
              <h3 className="text-sm font-bold text-white">Proyeksi Arus Kas 90 Hari</h3>
              <p className="text-xs text-gray-500">Berdasarkan AR/AP jatuh tempo · narasi AI</p>
            </div>
          </div>
          <button onClick={() => navigate("/ai")} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Analisis Penuh →
          </button>
        </div>
        <CashFlowForecast />
      </div>

    </div>
  );
}
