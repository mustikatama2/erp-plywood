import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { KPICard, Card } from "../../components/ui";
import { IDR, DATE, badge, PCT } from "../../lib/fmt";
import { CUSTOMERS, AR_INVOICES, AP_INVOICES, SALES_ORDERS, BANK_ACCOUNTS, EMPLOYEES, PNL_MONTHLY, BALANCE_SHEET, PRODUCTS } from "../../data/seed";

const TT = { contentStyle:{ background:"#111827", border:"1px solid #374151", borderRadius:8 }, labelStyle:{color:"#f3f4f6"} };

export default function Dashboard() {
  const totalAR     = AR_INVOICES.reduce((s,i) => s + i.balance * (i.currency==="USD"?15560:1), 0);
  const totalAP     = AP_INVOICES.reduce((s,i) => s + i.balance, 0);
  const overdueAR   = AR_INVOICES.filter(i => i.status === "Overdue");
  const overdueAP   = AP_INVOICES.filter(i => i.status === "Overdue");
  const openSO      = SALES_ORDERS.filter(s => !["Shipped","Cancelled"].includes(s.status)).length;
  const totalCash   = BANK_ACCOUNTS.reduce((s,b) => s + (b.currency==="USD"?b.balance*15560:b.balance), 0);
  const latestMonth = PNL_MONTHLY[PNL_MONTHLY.length-1];
  const prevMonth   = PNL_MONTHLY[PNL_MONTHLY.length-2];
  const revTrend    = ((latestMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100;
  const lowStock    = PRODUCTS.filter(p => p.stock_qty < p.reorder);

  const revenueChart = PNL_MONTHLY.map(m => ({
    month: m.month.split(" ")[0],
    revenue: Math.round(m.revenue/1000000),
    gross: Math.round(m.gross/1000000),
    net: Math.round(m.net/1000000),
  }));

  return (
    <div className="space-y-6">
      {/* Alerts bar */}
      {(overdueAR.length > 0 || overdueAP.length > 0 || lowStock.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {overdueAR.length > 0 && (
            <div className="flex-1 min-w-[200px] bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
              🔴 <strong>{overdueAR.length} overdue AR invoices</strong> — {IDR(overdueAR.reduce((s,i)=>s+i.balance*(i.currency==="USD"?15560:1),0))} outstanding
            </div>
          )}
          {overdueAP.length > 0 && (
            <div className="flex-1 min-w-[200px] bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-300">
              ⚠️ <strong>{overdueAP.length} overdue AP invoices</strong> — {IDR(overdueAP.reduce((s,i)=>s+i.balance,0))} due
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex-1 min-w-[200px] bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3 text-sm text-blue-300">
              📦 <strong>{lowStock.length} products below reorder level</strong>
            </div>
          )}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KPICard label="Monthly Revenue"   value={IDR(latestMonth.revenue)} color="text-green-400" icon="💰" trend={revTrend} />
        <KPICard label="Gross Profit"      value={IDR(latestMonth.gross)}   color="text-blue-400"  icon="📈" sub={`Margin ${PCT(latestMonth.gross/latestMonth.revenue*100)}`} />
        <KPICard label="Net Income"        value={IDR(latestMonth.net)}     color="text-purple-400"icon="🎯" sub={`NPM ${PCT(latestMonth.net/latestMonth.revenue*100)}`} />
        <KPICard label="Cash & Bank"       value={IDR(totalCash)}           color="text-teal-400"  icon="🏦" sub={`${BANK_ACCOUNTS.length} accounts`} />
        <KPICard label="AR Outstanding"    value={IDR(totalAR)}             color={overdueAR.length?"text-red-400":"text-white"} icon="📤" sub={`${AR_INVOICES.filter(i=>i.status!=="Paid").length} open invoices`} />
        <KPICard label="AP Outstanding"    value={IDR(totalAP)}             color={overdueAP.length?"text-amber-400":"text-white"} icon="📥" sub={`${AP_INVOICES.filter(i=>i.status!=="Paid").length} open bills`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue trend */}
        <div className="xl:col-span-2">
          <Card title="Revenue & Profitability — 6 Months (Rp Juta)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" tick={{fill:"#9ca3af",fontSize:11}} />
                <YAxis tick={{fill:"#9ca3af",fontSize:11}} />
                <Tooltip {...TT} formatter={(v)=>[`Rp ${v}jt`]} />
                <Bar dataKey="revenue" name="Revenue"      fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="gross"   name="Gross Profit" fill="#22c55e" radius={[3,3,0,0]} />
                <Bar dataKey="net"     name="Net Income"   fill="#a855f7" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Balance Sheet snapshot */}
        <Card title="Balance Sheet Snapshot">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Assets</p>
              {[
                ["Cash & Bank",   IDR(BALANCE_SHEET.assets.cash)],
                ["Receivables",   IDR(BALANCE_SHEET.assets.ar)],
                ["Inventory",     IDR(BALANCE_SHEET.assets.inventory)],
                ["Fixed Assets",  IDR(BALANCE_SHEET.assets.fixed_net)],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-1 border-b border-gray-800/50">
                  <span className="text-gray-400">{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-black text-green-400">
                <span>Total Assets</span>
                <span>{IDR(Object.values(BALANCE_SHEET.assets).reduce((a,b)=>a+b,0))}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 mt-3">Equity</p>
              <div className="flex justify-between font-black text-blue-400">
                <span>Total Equity</span>
                <span>{IDR(Object.values(BALANCE_SHEET.equity).reduce((a,b)=>a+b,0))}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Open Sales Orders */}
        <Card title={`Open Sales Orders (${openSO})`}>
          <div className="space-y-2">
            {SALES_ORDERS.filter(s => !["Shipped","Cancelled"].includes(s.status)).map(so => (
              <div key={so.id} className="flex items-center justify-between py-2 border-b border-gray-800/50 text-xs">
                <div>
                  <p className="font-medium text-white">{so.so_no}</p>
                  <p className="text-gray-500">{CUSTOMERS.find(c=>c.id===so.customer_id)?.name.split(" ").slice(0,2).join(" ")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{so.currency} {(so.total).toLocaleString()}</p>
                  <span className={badge(so.status)}>{so.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AR Aging */}
        <Card title="AR Aging Summary">
          <div className="space-y-2">
            {[["Current (≤30d)", AR_INVOICES.filter(i=>i.status==="Unpaid"), "text-green-400"],
              ["Overdue 31–60d", AR_INVOICES.filter(i=>i.status==="Partial"), "text-amber-400"],
              ["Overdue >60d",   AR_INVOICES.filter(i=>i.status==="Overdue"), "text-red-400"],
            ].map(([label, items, color]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800/50 text-sm">
                <div>
                  <span className={`text-xs font-bold ${color}`}>{label}</span>
                  <p className="text-xs text-gray-500">{items.length} invoices</p>
                </div>
                <span className={`font-black ${color}`}>
                  {IDR(items.reduce((s,i) => s + i.balance * (i.currency==="USD"?15560:1), 0))}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Inventory & Headcount */}
        <Card title="Quick Stats">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-2">Top Products by Stock</p>
              {PRODUCTS.filter(p=>p.category==="Plywood").slice(0,3).map(p => (
                <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs">
                  <div className="flex-1">
                    <p className="text-gray-300">{p.name}</p>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full ${p.stock_qty<p.reorder?"bg-red-500":"bg-blue-500"}`}
                        style={{width:`${Math.min(100,(p.stock_qty/(p.reorder*3))*100)}%`}} />
                    </div>
                  </div>
                  <span className={`font-bold w-16 text-right ${p.stock_qty<p.reorder?"text-red-400":"text-gray-300"}`}>
                    {p.stock_qty.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-3 grid grid-cols-2 gap-3 text-center">
              <div><p className="text-xl font-black text-white">{EMPLOYEES.length}</p><p className="text-xs text-gray-500">Employees</p></div>
              <div><p className="text-xl font-black text-white">{BANK_ACCOUNTS.length}</p><p className="text-xs text-gray-500">Bank Accounts</p></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
