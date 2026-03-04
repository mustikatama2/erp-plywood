import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { KPICard, Card, QuickActions, Tip, StatRow } from "../../components/ui";
import { IDR, DATE, badge, PCT } from "../../lib/fmt";
import { CUSTOMERS, AR_INVOICES, AP_INVOICES, SALES_ORDERS, BANK_ACCOUNTS, EMPLOYEES, PNL_MONTHLY, BALANCE_SHEET, PRODUCTS, PURCHASE_ORDERS, SHIPMENTS } from "../../data/seed";
import AnomalyPanel from "../../components/ai/AnomalyPanel";
import CashFlowForecast from "../../components/ai/CashFlowForecast";
import ActivityFeed from "../../components/ActivityFeed";
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";

const TT = { contentStyle:{ background:"#FFFFFF", border:"1px solid #DDD8CC", borderRadius:8 }, labelStyle:{color:"#1E2414"} };
const FX = 15560;

// ── Shared computed values ──────────────────────────────────────────────────
function useMetrics() {
  const journal = useJournal();
  const totalAR   = AR_INVOICES.reduce((s,i) => s + i.balance * (i.currency==="USD"?FX:1), 0);
  const totalAP   = AP_INVOICES.reduce((s,i) => s + i.balance, 0);
  const overdueAR = AR_INVOICES.filter(i => i.status === "Overdue");
  const overdueAP = AP_INVOICES.filter(i => i.status === "Overdue");
  const openSO    = SALES_ORDERS.filter(s => !["Shipped","Cancelled"].includes(s.status));
  const openPO    = (PURCHASE_ORDERS || []).filter(p => !["Received","Cancelled"].includes(p.status));
  const totalCash = BANK_ACCOUNTS.reduce((s,b) => s + (b.currency==="USD"?b.balance*FX:b.balance), 0);
  const lowStock  = PRODUCTS.filter(p => p.stock_qty < p.reorder);
  const livePnL   = journal.getPnL();
  const hasLive   = livePnL.revenue > 0;
  const cur       = hasLive
    ? { revenue: livePnL.revenue, gross: livePnL.grossProfit, net: livePnL.netIncome }
    : PNL_MONTHLY[PNL_MONTHLY.length-1];
  const prev      = PNL_MONTHLY[PNL_MONTHLY.length-2];
  const revTrend  = ((cur.revenue - prev.revenue) / prev.revenue) * 100;
  return { totalAR, totalAP, overdueAR, overdueAP, openSO, openPO, totalCash, lowStock, cur, prev, revTrend };
}

// ── Role greeting badge ─────────────────────────────────────────────────────
function WelcomeBanner({ user, role }) {
  if (!user) return null;
  return (
    <div className="erp-card p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${user.avatarColor || "bg-blue-600"} flex items-center justify-center text-white font-black text-base`}>
          {user.avatar}
        </div>
        <div>
          <p className="font-bold text-gray-900">👋 Selamat datang, {user.name.split(" ")[0]}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${role?.color}`}>{role?.label}</span>
            <span className="text-xs text-gray-500">{user.dept}</span>
          </div>
        </div>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-xs text-gray-400">ERP Mustikatama</p>
        <p className="text-xs text-gray-500">{new Date().toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
      </div>
    </div>
  );
}

// ── Finance role dashboard ──────────────────────────────────────────────────
function FinanceDashboard({ m, navigate }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Piutang" sublabel="AR Outstanding" value={IDR(m.totalAR)} color={m.overdueAR.length?"text-red-700":"text-amber-700"} icon="📤"
          sub={`${AR_INVOICES.filter(i=>i.status!=="Paid").length} invoice terbuka`} />
        <KPICard label="Sudah Jatuh Tempo" sublabel="Overdue AR" value={m.overdueAR.length} icon="🔴" color="text-red-700"
          sub={`${IDR(m.overdueAR.reduce((s,i)=>s+i.balance*(i.currency==="USD"?FX:1),0))}`} />
        <KPICard label="Total Hutang" sublabel="AP Outstanding" value={IDR(m.totalAP)} color={m.overdueAP.length?"text-amber-700":"text-gray-900"} icon="📥"
          sub={`${AP_INVOICES.filter(i=>i.status!=="Paid").length} tagihan`} />
        <KPICard label="Kas & Bank" sublabel="Total Cash" value={IDR(m.totalCash)} color="text-teal-700" icon="🏦"
          sub={`${BANK_ACCOUNTS.length} rekening`} />
      </div>

      {/* AR Aging quick view */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Aging Piutang" subtitle="Siapa yang perlu ditagih">
          {[
            { label:"Belum Jatuh Tempo", items:AR_INVOICES.filter(i=>i.status==="Unpaid"), color:"text-green-700", dot:"🟢" },
            { label:"Dibayar Sebagian",  items:AR_INVOICES.filter(i=>i.status==="Partial"), color:"text-amber-700", dot:"🟡" },
            { label:"Sudah Jatuh Tempo",items:AR_INVOICES.filter(i=>i.status==="Overdue"), color:"text-red-700", dot:"🔴" },
          ].map(({label,items,color,dot})=>(
            <button key={label} onClick={()=>navigate("/finance/ar")}
              className="w-full flex items-center justify-between py-2.5 border-b border-gray-100 text-sm hover:bg-gray-50 rounded px-1 transition-colors">
              <span className="flex items-center gap-2 text-gray-800">{dot} {label} <span className="text-gray-400 text-xs">({items.length})</span></span>
              <span className={`font-black ${color}`}>{IDR(items.reduce((s,i)=>s+i.balance*(i.currency==="USD"?FX:1),0))}</span>
            </button>
          ))}
        </Card>

        <Card title="Posisi Kas & Bank" subtitle="Saldo rekening hari ini">
          {BANK_ACCOUNTS.map(b => (
            <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm">
              <div>
                <p className="font-medium text-gray-900">{b.bank_name}</p>
                <p className="text-xs text-gray-500">{b.account_no} · {b.currency}</p>
              </div>
              <span className="font-black text-teal-700">{b.currency === "USD" ? `$${b.balance.toLocaleString()}` : IDR(b.balance)}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Today's actions */}
      <Card title="Aksi Hari Ini" subtitle="Finance checklist">
        <div className="space-y-2">
          {[
            { icon:"💰", label:"Cek AR overdue — kirim reminder ke customer", path:"/finance/ar" },
            { icon:"💳", label:"Cek AP jatuh tempo — siapkan pembayaran vendor", path:"/finance/ap" },
            { icon:"🏦", label:"Rekonsiliasi mutasi bank hari ini", path:"/finance/banks" },
            { icon:"📒", label:"Review buku besar / jurnal terbaru", path:"/finance/ledger" },
          ].map(a => (
            <button key={a.label} onClick={()=>navigate(a.path)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-50 border border-gray-100 text-left transition-colors group">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-blue-700">{a.label}</span>
              <span className="ml-auto text-gray-300 group-hover:text-blue-400">→</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Sales role dashboard ────────────────────────────────────────────────────
function SalesDashboard({ m, navigate }) {
  const revenueChart = PNL_MONTHLY.slice(-4).map(month => ({
    bulan: month.month.split(" ")[0],
    Pendapatan: Math.round(month.revenue/1e6),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Order Aktif" sublabel="Open Sales Orders" value={m.openSO.length} icon="📄" color="text-blue-700" />
        <KPICard label="Piutang Customer" sublabel="AR Outstanding" value={IDR(m.totalAR)} color="text-amber-700" icon="📤" />
        <KPICard label="Pengiriman" sublabel="Total Shipments" value={(SHIPMENTS||[]).length} icon="🚢" color="text-teal-700" />
        <KPICard label="Revenue Bulan Ini" sublabel="Monthly Revenue" value={IDR(m.cur.revenue)} color="text-green-700" icon="💰" trend={m.revTrend} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Revenue 4 Bulan Terakhir" subtitle="Rp Juta">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bulan" tick={{fill:"#9ca3af",fontSize:11}} />
              <YAxis tick={{fill:"#9ca3af",fontSize:11}} />
              <Tooltip {...TT} formatter={v=>[`Rp ${v}jt`]} />
              <Bar dataKey="Pendapatan" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title={`Order Aktif (${m.openSO.length})`} subtitle="Sales orders belum selesai">
          <div className="space-y-2">
            {m.openSO.slice(0,5).map(so => {
              const cust = CUSTOMERS.find(c=>c.id===so.customer_id);
              return (
                <button key={so.id} onClick={()=>navigate("/sales/orders")}
                  className="w-full flex items-center justify-between py-2 border-b border-gray-100 text-xs hover:bg-gray-50 rounded px-1 transition-colors">
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{so.so_no}</p>
                    <p className="text-gray-500">{cust?.name.split(" ").slice(0,3).join(" ")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{so.currency} {so.total.toLocaleString()}</p>
                    <span className={badge(so.status)}>{so.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="Aksi Hari Ini" subtitle="Sales checklist">
        <div className="space-y-2">
          {[
            { icon:"📄", label:"Buat Sales Order baru",          path:"/sales/orders" },
            { icon:"📋", label:"Kirim Proforma Invoice ke buyer", path:"/sales/proforma" },
            { icon:"🚢", label:"Update status pengiriman",        path:"/sales/shipments" },
            { icon:"💰", label:"Follow up pembayaran customer",   path:"/finance/ar" },
          ].map(a => (
            <button key={a.label} onClick={()=>navigate(a.path)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-blue-50 border border-gray-100 text-left transition-colors group">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-blue-700">{a.label}</span>
              <span className="ml-auto text-gray-300 group-hover:text-blue-400">→</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Purchasing role dashboard ───────────────────────────────────────────────
function PurchasingDashboard({ m, navigate }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="PO Terbuka" sublabel="Open Purchase Orders" value={m.openPO.length} icon="🛒" color="text-purple-700" />
        <KPICard label="Hutang Vendor" sublabel="AP Outstanding" value={IDR(m.totalAP)} color={m.overdueAP.length?"text-amber-700":"text-gray-900"} icon="💳" />
        <KPICard label="Tagihan Jatuh Tempo" sublabel="AP Overdue" value={m.overdueAP.length} icon="⚠️" color="text-red-700"
          sub={m.overdueAP.length > 0 ? IDR(m.overdueAP.reduce((s,i)=>s+i.balance,0)) : "Semua lancar"} />
        <KPICard label="Penerimaan Pending" sublabel="GR Pending" value={m.openPO.filter(p=>p.status==="Confirmed").length} icon="📦" color="text-teal-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title={`Purchase Orders Aktif (${m.openPO.length})`} subtitle="PO yang belum selesai">
          {m.openPO.slice(0,5).map(po => (
            <button key={po.id} onClick={()=>navigate("/purchasing/orders")}
              className="w-full flex items-center justify-between py-2.5 border-b border-gray-100 text-sm hover:bg-gray-50 rounded px-1 transition-colors">
              <div>
                <p className="font-mono font-bold text-purple-700">{po.po_no}</p>
                <p className="text-xs text-gray-500">{po.delivery_date ? `Kirim: ${DATE(po.delivery_date)}` : "—"}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{IDR(po.total)}</p>
                <span className={badge(po.status)}>{po.status}</span>
              </div>
            </button>
          ))}
        </Card>

        <Card title="AP Aging — Vendor" subtitle="Hutang yang perlu dibayar">
          {[
            { label:"Belum Jatuh Tempo", items:AP_INVOICES.filter(i=>i.status==="Unpaid"), color:"text-green-700", dot:"🟢" },
            { label:"Dibayar Sebagian",  items:AP_INVOICES.filter(i=>i.status==="Partial"), color:"text-amber-700", dot:"🟡" },
            { label:"Sudah Jatuh Tempo",items:AP_INVOICES.filter(i=>i.status==="Overdue"), color:"text-red-700", dot:"🔴" },
          ].map(({label,items,color,dot})=>(
            <button key={label} onClick={()=>navigate("/finance/ap")}
              className="w-full flex items-center justify-between py-2.5 border-b border-gray-100 text-sm hover:bg-gray-50 rounded px-1 transition-colors">
              <span className="flex items-center gap-2 text-gray-800">{dot} {label}</span>
              <span className={`font-black ${color}`}>{IDR(items.reduce((s,i)=>s+i.balance,0))}</span>
            </button>
          ))}
        </Card>
      </div>

      <Card title="Aksi Hari Ini" subtitle="Purchasing checklist">
        <div className="space-y-2">
          {[
            { icon:"🛒", label:"Buat Purchase Order baru", path:"/purchasing/orders" },
            { icon:"📦", label:"Konfirmasi penerimaan barang (GR)", path:"/purchasing/receipts" },
            { icon:"💳", label:"Review tagihan vendor jatuh tempo", path:"/finance/ap" },
            { icon:"🏢", label:"Update data vendor", path:"/purchasing/vendors" },
          ].map(a => (
            <button key={a.label} onClick={()=>navigate(a.path)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-purple-50 border border-gray-100 text-left transition-colors group">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-purple-700">{a.label}</span>
              <span className="ml-auto text-gray-300 group-hover:text-purple-400">→</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Warehouse role dashboard ────────────────────────────────────────────────
function WarehouseDashboard({ m, navigate }) {
  const stockValue = PRODUCTS.reduce((s,p) => s + p.stock_qty * p.price_idr, 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Stok Hampir Habis" sublabel="Below Reorder Point" value={m.lowStock.length} icon="⚠️" color={m.lowStock.length?"text-red-700":"text-green-700"}
          sub={m.lowStock.length > 0 ? `${m.lowStock.map(p=>p.name.split(" ").slice(0,2).join(" ")).slice(0,2).join(", ")}` : "Semua aman"} />
        <KPICard label="Total Produk" sublabel="Active SKUs" value={PRODUCTS.length} icon="🪵" color="text-blue-700" />
        <KPICard label="Nilai Stok" sublabel="Stock Value" value={IDR(stockValue)} icon="💎" color="text-teal-700" />
        <KPICard label="GR Menunggu" sublabel="Pending Goods Receipt" value={m.openPO.filter(p=>p.status==="Confirmed").length} icon="📦" color="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Produk Stok Rendah" subtitle="Di bawah batas reorder">
          {m.lowStock.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">✅ Semua stok di atas reorder point</p>
          ) : (
            m.lowStock.map(p => (
              <button key={p.id} onClick={()=>navigate("/inventory/stock")}
                className="w-full flex items-center gap-3 py-2.5 border-b border-gray-100 hover:bg-gray-50 rounded px-1 transition-colors">
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className="h-1.5 rounded-full bg-red-500" style={{width:`${Math.min(100,(p.stock_qty/(p.reorder*2))*100)}%`}} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-red-700">{p.stock_qty.toLocaleString()}</span>
                  <p className="text-xs text-gray-400">min: {p.reorder.toLocaleString()}</p>
                </div>
              </button>
            ))
          )}
        </Card>

        <Card title="Stok Produk Utama" subtitle="Level stok plywood hari ini">
          {PRODUCTS.filter(p=>p.category==="Plywood").slice(0,5).map(p => (
            <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
              <div className="flex-1">
                <p className="text-xs text-gray-700">{p.name}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                  <div className={`h-1.5 rounded-full ${p.stock_qty<p.reorder?"bg-red-500":"bg-blue-500"}`}
                    style={{width:`${Math.min(100,(p.stock_qty/(p.reorder*3))*100)}%`}} />
                </div>
              </div>
              <span className={`text-sm font-black w-16 text-right ${p.stock_qty<p.reorder?"text-red-700":"text-gray-700"}`}>
                {p.stock_qty.toLocaleString()} {p.stock_qty<p.reorder?"⚠️":""}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Aksi Hari Ini" subtitle="Warehouse checklist">
        <div className="space-y-2">
          {[
            { icon:"📦", label:"Proses penerimaan barang masuk", path:"/purchasing/receipts" },
            { icon:"🔄", label:"Catat mutasi stok keluar", path:"/inventory/movements" },
            { icon:"📐", label:"Cek level stok terkini", path:"/inventory/stock" },
            { icon:"📋", label:"Lihat laporan inventori", path:"/inventory/report" },
          ].map(a => (
            <button key={a.label} onClick={()=>navigate(a.path)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-teal-50 border border-gray-100 text-left transition-colors group">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-teal-700">{a.label}</span>
              <span className="ml-auto text-gray-300 group-hover:text-teal-400">→</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── HR role dashboard ───────────────────────────────────────────────────────
function HRDashboard({ navigate }) {
  const headcount = EMPLOYEES.length;
  const depts = [...new Set(EMPLOYEES.map(e => e.dept))].length;
  const newThisMonth = EMPLOYEES.filter(e => {
    if (!e.join_date) return false;
    const d = new Date(e.join_date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalPayroll = EMPLOYEES.reduce((s,e) => s + (e.salary || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Total Karyawan" sublabel="Headcount" value={headcount} icon="👥" color="text-pink-700" />
        <KPICard label="Departemen" sublabel="Departments" value={depts} icon="🏢" color="text-blue-700" />
        <KPICard label="Karyawan Baru" sublabel="New hires this month" value={newThisMonth} icon="🆕" color="text-green-700" sub={newThisMonth === 0 ? "Tidak ada" : `+${newThisMonth} bulan ini`} />
        <KPICard label="Total Gaji" sublabel="Payroll estimate" value={IDR(totalPayroll)} icon="💵" color="text-purple-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card title="Distribusi Karyawan per Dept" subtitle="Headcount per departemen">
          {Object.entries(EMPLOYEES.reduce((acc, e) => {
            acc[e.dept] = (acc[e.dept] || 0) + 1;
            return acc;
          }, {})).map(([dept, count]) => (
            <div key={dept} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">{dept}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-pink-500" style={{width:`${(count/headcount)*100}%`}} />
                </div>
                <span className="text-sm font-black text-gray-900 w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Karyawan Terbaru" subtitle="5 karyawan terakhir">
          {EMPLOYEES.slice(0,5).map(e => (
            <button key={e.id} onClick={()=>navigate("/hr/employees")}
              className="w-full flex items-center gap-3 py-2.5 border-b border-gray-100 hover:bg-pink-50 rounded px-1 transition-colors text-left">
              <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {e.name?.charAt(0) || "?"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{e.name}</p>
                <p className="text-xs text-gray-500">{e.dept} · {e.position}</p>
              </div>
            </button>
          ))}
        </Card>
      </div>

      <Card title="Aksi Hari Ini" subtitle="HR checklist">
        <div className="space-y-2">
          {[
            { icon:"👤", label:"Tambah / update data karyawan", path:"/hr/employees" },
            { icon:"💵", label:"Proses penggajian bulan ini", path:"/hr/payroll" },
          ].map(a => (
            <button key={a.label} onClick={()=>navigate(a.path)}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-pink-50 border border-gray-100 text-left transition-colors group">
              <span className="text-lg">{a.icon}</span>
              <span className="text-sm text-gray-700 group-hover:text-pink-700">{a.label}</span>
              <span className="ml-auto text-gray-300 group-hover:text-pink-400">→</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Viewer role dashboard ───────────────────────────────────────────────────
function ViewerDashboard({ m, navigate }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard label="Revenue Bulan Ini" sublabel="Monthly Revenue" value={IDR(m.cur.revenue)} color="text-green-700" icon="💰" trend={m.revTrend} />
        <KPICard label="Laba Bersih" sublabel="Net Income" value={IDR(m.cur.net)} color="text-blue-700" icon="📈"
          sub={`NPM ${PCT(m.cur.net/m.cur.revenue*100)}`} />
        <KPICard label="Unit Dikirim" sublabel="Shipments" value={(SHIPMENTS||[]).filter(s=>s.status==="Completed").length} icon="🚢" color="text-teal-700" />
        <KPICard label="Pelanggan Aktif" sublabel="Active Customers" value={new Set(AR_INVOICES.map(i=>i.customer_id)).size} icon="👥" color="text-purple-700" />
      </div>
      <Card title="Ringkasan Kinerja Keuangan" subtitle="Baca saja — laporan">
        <div className="py-4 text-center text-gray-400 text-sm">
          <p className="text-2xl mb-2">📊</p>
          <p>Untuk laporan lengkap, klik tombol di bawah</p>
          <button onClick={()=>navigate("/finance/reports")}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Lihat Laporan Keuangan →
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── Full admin dashboard (original) ────────────────────────────────────────
function AdminDashboard({ m, navigate }) {
  const { overdueAR, overdueAP, lowStock, cur, prev, revTrend, totalAR, totalAP, totalCash, openSO } = m;

  const revenueChart = PNL_MONTHLY.map(month => ({
    bulan: month.month.split(" ")[0],
    Pendapatan: Math.round(month.revenue/1e6),
    "Laba Kotor": Math.round(month.gross/1e6),
    "Laba Bersih": Math.round(month.net/1e6),
  }));

  return (
    <div className="space-y-5">
      {/* Alerts */}
      {(overdueAR.length > 0 || overdueAP.length > 0 || lowStock.length > 0) && (
        <div className="space-y-2">
          {overdueAR.length > 0 && (
            <button onClick={() => navigate("/finance/ar")} className="w-full text-left bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 hover:bg-red-500/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <div>
                    <p className="text-sm font-bold text-red-300">Piutang Jatuh Tempo (Overdue AR)</p>
                    <p className="text-xs text-red-700">{overdueAR.length} invoice belum dibayar · Total {IDR(overdueAR.reduce((s,i)=>s+i.balance*(i.currency==="USD"?FX:1),0))}</p>
                  </div>
                </div>
                <span className="text-red-700 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          )}
          {overdueAP.length > 0 && (
            <button onClick={() => navigate("/finance/ap")} className="w-full text-left bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 hover:bg-amber-500/20 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-bold text-amber-700">Tagihan Vendor Jatuh Tempo</p>
                    <p className="text-xs text-amber-700">{overdueAP.length} tagihan belum dibayar · {IDR(overdueAP.reduce((s,i)=>s+i.balance,0))}</p>
                  </div>
                </div>
                <span className="text-amber-700 group-hover:translate-x-1 transition-transform">→</span>
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
                    <p className="text-xs text-blue-700">{lowStock.length} produk di bawah batas reorder</p>
                  </div>
                </div>
                <span className="text-blue-700 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </button>
          )}
        </div>
      )}

      <QuickActions actions={[
        { icon:"📄", label:"Buat Sales Order", sublabel:"Order dari customer baru", onClick:()=>navigate("/sales/orders") },
        { icon:"📋", label:"Buat Proforma",    sublabel:"Kirim penawaran harga",    onClick:()=>navigate("/sales/proforma") },
        { icon:"💰", label:"Catat Pembayaran", sublabel:"Terima bayaran customer",  onClick:()=>navigate("/finance/ar") },
        { icon:"📈", label:"Laporan Keuangan", sublabel:"P&L, Neraca, Rasio",       onClick:()=>navigate("/finance/reports") },
      ]} />

      {/* AI Anomaly */}
      <div className="erp-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Deteksi Anomali AI</h3>
              <p className="text-xs text-gray-500">Smart alerts · diperbarui otomatis</p>
            </div>
          </div>
          <button onClick={() => navigate("/ai")} className="text-xs text-blue-700 hover:text-blue-300 transition-colors">Buka Asisten AI →</button>
        </div>
        <AnomalyPanel compact={true} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Pendapatan Bulan Ini" sublabel="Revenue" value={IDR(cur.revenue)} color="text-green-700" icon="💰" trend={revTrend} />
        <KPICard label="Laba Kotor"           sublabel="Gross Profit" value={IDR(cur.gross)}   color="text-blue-700"  icon="📈" sub={`Margin ${PCT(cur.gross/cur.revenue*100)}`} />
        <KPICard label="Laba Bersih"          sublabel="Net Income"   value={IDR(cur.net)}     color="text-purple-700"icon="🎯" sub={`NPM ${PCT(cur.net/cur.revenue*100)}`} />
        <KPICard label="Total Kas & Bank"     sublabel="Cash & Bank"  value={IDR(totalCash)}   color="text-teal-400"  icon="🏦" sub={`${BANK_ACCOUNTS.length} rekening`} />
        <KPICard label="Piutang Belum Terima" sublabel="AR Outstanding" value={IDR(totalAR)} color={overdueAR.length?"text-red-700":"text-gray-900"} icon="📤"
          sub={`${AR_INVOICES.filter(i=>i.status!=="Paid").length} invoice terbuka`} />
        <KPICard label="Hutang Belum Bayar"   sublabel="AP Outstanding" value={IDR(totalAP)} color={overdueAP.length?"text-amber-700":"text-gray-900"} icon="📥"
          sub={`${AP_INVOICES.filter(i=>i.status!=="Paid").length} tagihan terbuka`} />
      </div>

      {/* Charts */}
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
            <StatRow label="Piutang"  sublabel="AR" value={IDR(BALANCE_SHEET.assets.ar)}   color="text-amber-700" />
            <StatRow label="Stok / Inventori"         value={IDR(BALANCE_SHEET.assets.inventory)} />
            <StatRow label="Aset Tetap (net)"         value={IDR(BALANCE_SHEET.assets.fixed_net)} />
            <StatRow label="Total Aset" value={IDR(Object.values(BALANCE_SHEET.assets).reduce((a,b)=>a+b,0))} color="text-green-700" border={false} />
            <div className="border-t border-gray-200 my-2"/>
            <StatRow label="Total Ekuitas" sublabel="Equity" value={IDR(Object.values(BALANCE_SHEET.equity).reduce((a,b)=>a+b,0))} color="text-blue-700" border={false} />
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card title={`Order Aktif (${openSO.length})`} subtitle="Sales orders belum selesai">
          {openSO.length === 0 ? (
            <p className="text-center py-6 text-gray-500">Tidak ada order aktif</p>
          ) : (
            <div className="space-y-2">
              {openSO.map(so => {
                const cust = CUSTOMERS.find(c=>c.id===so.customer_id);
                return (
                  <button key={so.id} onClick={()=>navigate("/sales/orders")}
                    className="w-full flex items-center justify-between py-2.5 border-b border-gray-200/50 text-xs hover:bg-gray-100/30 rounded px-1 transition-colors group">
                    <div className="text-left">
                      <p className="font-bold text-gray-900 group-hover:text-blue-300">{so.so_no}</p>
                      <p className="text-gray-500">{cust?.name.split(" ").slice(0,3).join(" ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{so.currency} {so.total.toLocaleString()}</p>
                      <span className={badge(so.status)}>{so.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Umur Piutang" subtitle="AR Aging — siapa yang perlu ditagih">
          {[
            { label:"Belum Jatuh Tempo", sublabel:"Current ≤ 30 hari", items:AR_INVOICES.filter(i=>i.status==="Unpaid"), color:"text-green-700", dot:"🟢" },
            { label:"Dibayar Sebagian",  sublabel:"Partial payment",    items:AR_INVOICES.filter(i=>i.status==="Partial"), color:"text-amber-700", dot:"🟡" },
            { label:"Sudah Jatuh Tempo", sublabel:"Overdue > 60 hari",  items:AR_INVOICES.filter(i=>i.status==="Overdue"), color:"text-red-700",   dot:"🔴" },
          ].map(({label,sublabel,items,color,dot})=>(
            <button key={label} onClick={()=>navigate("/finance/ar")}
              className="w-full flex items-center justify-between py-2.5 border-b border-gray-200/50 text-sm hover:bg-gray-100/30 rounded px-1 transition-colors">
              <div className="text-left">
                <p className="font-medium text-gray-900 flex items-center gap-1.5">{dot} {label}</p>
                <p className="text-xs text-gray-500">{sublabel} · {items.length} invoice</p>
              </div>
              <span className={`font-black ${color}`}>
                {IDR(items.reduce((s,i)=>s+i.balance*(i.currency==="USD"?FX:1),0))}
              </span>
            </button>
          ))}
        </Card>

        <Card title="Stok Produk" subtitle="Produk utama — level stok hari ini">
          <div className="space-y-3">
            {PRODUCTS.filter(p=>p.category==="Plywood").slice(0,4).map(p => (
              <button key={p.id} onClick={()=>navigate("/inventory/stock")}
                className="w-full flex items-center gap-3 py-1.5 hover:bg-gray-100/30 rounded px-1 transition-colors group">
                <div className="flex-1 text-left">
                  <p className="text-xs text-gray-700 group-hover:text-gray-900">{p.name}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${p.stock_qty<p.reorder?"bg-red-500":"bg-blue-500"}`}
                      style={{width:`${Math.min(100,(p.stock_qty/(p.reorder*3))*100)}%`}} />
                  </div>
                </div>
                <span className={`text-sm font-black w-20 text-right flex-shrink-0 ${p.stock_qty<p.reorder?"text-red-700":"text-gray-700"}`}>
                  {p.stock_qty.toLocaleString()} {p.stock_qty<p.reorder?"⚠️":""}
                </span>
              </button>
            ))}
            <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-2 text-center">
              <div className="erp-card p-2">
                <p className="text-lg font-black text-gray-900">{EMPLOYEES.length}</p>
                <p className="text-xs text-gray-500">Karyawan</p>
              </div>
              <div className="erp-card p-2">
                <p className="text-lg font-black text-gray-900">{BANK_ACCOUNTS.length}</p>
                <p className="text-xs text-gray-500">Rekening Bank</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Cash Flow */}
      <div className="erp-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📈</span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Proyeksi Arus Kas 90 Hari</h3>
              <p className="text-xs text-gray-500">Berdasarkan AR/AP jatuh tempo · narasi AI</p>
            </div>
          </div>
          <button onClick={() => navigate("/ai")} className="text-xs text-blue-700 hover:text-blue-300 transition-colors">Analisis Penuh →</button>
        </div>
        <CashFlowForecast />
      </div>

      {/* Activity Feed */}
      <div className="erp-card p-4">
        <ActivityFeed limit={8} compact={true} />
      </div>
    </div>
  );
}

// ── Main Dashboard component ────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const m = useMetrics();

  const renderRoleDashboard = () => {
    const r = user?.role;
    if (!r || r === "admin") return <AdminDashboard m={m} navigate={navigate} />;
    if (r === "finance")   return (
      <div className="space-y-5">
        <FinanceDashboard m={m} navigate={navigate} />
        <div className="erp-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📈</span>
              <h3 className="text-sm font-bold text-gray-900">Proyeksi Arus Kas 90 Hari</h3>
            </div>
            <button onClick={() => navigate("/ai")} className="text-xs text-blue-700">Analisis Penuh →</button>
          </div>
          <CashFlowForecast />
        </div>
        <div className="erp-card p-4"><ActivityFeed limit={6} compact /></div>
      </div>
    );
    if (r === "sales")     return (
      <div className="space-y-5">
        <SalesDashboard m={m} navigate={navigate} />
        <div className="erp-card p-4"><ActivityFeed limit={5} module="Sales" compact /></div>
      </div>
    );
    if (r === "purchasing") return (
      <div className="space-y-5">
        <PurchasingDashboard m={m} navigate={navigate} />
        <div className="erp-card p-4"><ActivityFeed limit={5} module="Purchasing" compact /></div>
      </div>
    );
    if (r === "warehouse") return (
      <div className="space-y-5">
        <WarehouseDashboard m={m} navigate={navigate} />
        <div className="erp-card p-4"><ActivityFeed limit={5} module="Inventory" compact /></div>
      </div>
    );
    if (r === "hr")        return (
      <div className="space-y-5">
        <HRDashboard navigate={navigate} />
        <div className="erp-card p-4"><ActivityFeed limit={5} module="HR" compact /></div>
      </div>
    );
    if (r === "viewer")    return <ViewerDashboard m={m} navigate={navigate} />;
    return <AdminDashboard m={m} navigate={navigate} />;
  };

  return (
    <div className="space-y-5">
      <WelcomeBanner user={user} role={role} />
      {renderRoleDashboard()}
    </div>
  );
}
