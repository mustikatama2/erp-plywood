import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PageHeader, Card, Btn, KPICard } from "../../components/ui";
import { IDR, PCT, NUM } from "../../lib/fmt";
import { PNL_MONTHLY, BALANCE_SHEET } from "../../data/seed";

const TT = { contentStyle:{background:"#111827",border:"1px solid #374151",borderRadius:8}, labelStyle:{color:"#f3f4f6"} };

function PnLReport() {
  const cur = PNL_MONTHLY[PNL_MONTHLY.length-1];
  const ytd = PNL_MONTHLY.reduce((a,m)=>({
    revenue:a.revenue+m.revenue, cogs:a.cogs+m.cogs, gross:a.gross+m.gross,
    opex:a.opex+m.opex, ebitda:a.ebitda+m.ebitda, net:a.net+m.net
  }), {revenue:0,cogs:0,gross:0,opex:0,ebitda:0,net:0});

  const Row = ({label,value,pct,bold,indent,color="text-gray-300"}) => (
    <div className={`flex justify-between py-2 border-b border-gray-800/50 text-sm ${bold?"font-black text-white":""}`}>
      <span className={`${indent?"ml-5 text-gray-400":""} ${color}`}>{label}</span>
      <div className="flex gap-8 text-right">
        <span className="w-32 font-mono">{IDR(value)}</span>
        {pct!=null&&<span className={`w-16 text-xs ${pct>=20?"text-green-400":pct>=10?"text-amber-400":"text-red-400"}`}>{PCT(pct)}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Monthly trend */}
      <Card title="Revenue & Profit Trend (Rp Juta)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={PNL_MONTHLY.map(m=>({
            month:m.month.slice(0,3), rev:Math.round(m.revenue/1e6), gross:Math.round(m.gross/1e6), net:Math.round(m.net/1e6)
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
            <XAxis dataKey="month" tick={{fill:"#9ca3af",fontSize:11}}/>
            <YAxis tick={{fill:"#9ca3af",fontSize:11}}/>
            <Tooltip {...TT}/>
            <Line type="monotone" dataKey="rev"   name="Revenue"      stroke="#3b82f6" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="gross" name="Gross Profit"  stroke="#22c55e" strokeWidth={2} dot={false}/>
            <Line type="monotone" dataKey="net"   name="Net Income"    stroke="#a855f7" strokeWidth={2} dot={false}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* P&L Statement */}
      <Card title="Profit & Loss Statement — Year to Date 2026"
        action={<Btn size="xs" variant="secondary">📤 Export PDF</Btn>}>
        <div className="px-0">
          <div className="flex justify-between text-xs text-gray-500 mb-2 px-0 border-b border-gray-800 pb-2 font-bold uppercase tracking-wider">
            <span>Description</span>
            <div className="flex gap-8 text-right"><span className="w-32">YTD 2026</span><span className="w-16">Margin</span></div>
          </div>
          <Row label="Net Revenue"          value={ytd.revenue} pct={100}                    bold />
          <Row label="Cost of Goods Sold"   value={ytd.cogs}    pct={ytd.cogs/ytd.revenue*100} indent color="text-red-400" />
          <Row label="Gross Profit"         value={ytd.gross}   pct={ytd.gross/ytd.revenue*100} bold color="text-green-400" />
          <Row label="Operating Expenses"   value={ytd.opex}    indent color="text-red-400" />
          <Row label="EBITDA"               value={ytd.ebitda}  pct={ytd.ebitda/ytd.revenue*100} bold color="text-blue-400" />
          <Row label="Interest Expense"     value={PNL_MONTHLY.reduce((s,m)=>s+m.interest,0)} indent color="text-red-400" />
          <Row label="Income Tax"           value={PNL_MONTHLY.reduce((s,m)=>s+m.tax,0)}      indent color="text-red-400" />
          <Row label="Net Income"           value={ytd.net}     pct={ytd.net/ytd.revenue*100} bold color="text-purple-400" />
        </div>
      </Card>

      {/* Month summary table */}
      <Card title="Monthly Detail">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead><tr><th>Month</th><th className="text-right">Revenue</th><th className="text-right">Gross Profit</th><th className="text-right">GPM</th><th className="text-right">Net Income</th><th className="text-right">NPM</th></tr></thead>
            <tbody>
              {PNL_MONTHLY.map(m=>(
                <tr key={m.month}>
                  <td className="font-medium">{m.month}</td>
                  <td className="text-right font-mono">{IDR(m.revenue)}</td>
                  <td className="text-right font-mono text-green-400">{IDR(m.gross)}</td>
                  <td className="text-right"><span className={`text-xs font-bold ${m.gross/m.revenue>0.28?"text-green-400":"text-amber-400"}`}>{PCT(m.gross/m.revenue*100)}</span></td>
                  <td className="text-right font-mono text-purple-400">{IDR(m.net)}</td>
                  <td className="text-right"><span className="text-xs">{PCT(m.net/m.revenue*100)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function BalanceSheetReport() {
  const bs = BALANCE_SHEET;
  const totalAssets = Object.values(bs.assets).reduce((a,b)=>a+b,0);
  const totalLiab   = Object.values(bs.liabilities).reduce((a,b)=>a+b,0);
  const totalEquity = Object.values(bs.equity).reduce((a,b)=>a+b,0);

  const Section = ({title, items, total, color="text-white"}) => (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-4 mb-2">{title}</p>
      {items.map(([k,v])=>(
        <div key={k} className="flex justify-between py-1.5 border-b border-gray-800/40 text-sm">
          <span className="text-gray-400 ml-4">{k}</span>
          <span className="font-mono">{IDR(v)}</span>
        </div>
      ))}
      <div className={`flex justify-between py-2 text-sm font-black ${color}`}>
        <span>{title} Total</span><span className="font-mono">{IDR(total)}</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Card title="Assets" action={<Btn size="xs" variant="secondary">📤 PDF</Btn>}>
        <Section title="Current Assets" color="text-blue-400" total={bs.assets.cash+bs.assets.ar+bs.assets.inventory+bs.assets.prepaid}
          items={[["Cash & Bank",bs.assets.cash],["Accounts Receivable",bs.assets.ar],["Inventory",bs.assets.inventory],["Prepaid Expenses",bs.assets.prepaid]]} />
        <Section title="Fixed Assets" color="text-teal-400" total={bs.assets.fixed_net}
          items={[["Fixed Assets (net of depreciation)",bs.assets.fixed_net]]} />
        <div className="flex justify-between py-3 text-lg font-black text-green-400 border-t border-gray-700 mt-2">
          <span>TOTAL ASSETS</span><span>{IDR(totalAssets)}</span>
        </div>
      </Card>

      <Card title="Liabilities & Equity">
        <Section title="Current Liabilities" color="text-red-400" total={bs.liabilities.ap+bs.liabilities.accrued+bs.liabilities.tax_payable+bs.liabilities.short_loans}
          items={[["Accounts Payable",bs.liabilities.ap],["Accrued Liabilities",bs.liabilities.accrued],["Tax Payable",bs.liabilities.tax_payable],["Short-term Loans",bs.liabilities.short_loans]]} />
        <Section title="Long-term Liabilities" color="text-orange-400" total={bs.liabilities.long_loans}
          items={[["Bank Loans",bs.liabilities.long_loans]]} />
        <Section title="Equity" color="text-purple-400" total={totalEquity}
          items={[["Paid-in Capital",bs.equity.paid_in],["Retained Earnings",bs.equity.retained]]} />
        <div className="flex justify-between py-3 text-lg font-black text-green-400 border-t border-gray-700 mt-2">
          <span>TOTAL L + E</span><span>{IDR(totalLiab+totalEquity)}</span>
        </div>
        {Math.abs(totalAssets-(totalLiab+totalEquity)) < 1000 && (
          <div className="mt-2 text-xs text-green-400 text-center">✅ Balance sheet is balanced</div>
        )}
      </Card>
    </div>
  );
}

function KPIReport() {
  const cur  = PNL_MONTHLY[PNL_MONTHLY.length-1];
  const prev = PNL_MONTHLY[PNL_MONTHLY.length-2];
  const trend = (a,b) => ((a-b)/b*100).toFixed(1);
  const bs = BALANCE_SHEET;
  const totalAssets = Object.values(bs.assets).reduce((a,b)=>a+b,0);
  const totalLiab = Object.values(bs.liabilities).reduce((a,b)=>a+b,0);
  const equity = Object.values(bs.equity).reduce((a,b)=>a+b,0);
  const kpis = [
    {label:"Gross Profit Margin",value:PCT(cur.gross/cur.revenue*100),desc:"Revenue − COGS / Revenue",color:"text-green-400"},
    {label:"Net Profit Margin",  value:PCT(cur.net/cur.revenue*100),  desc:"Net income / Revenue",color:"text-purple-400"},
    {label:"EBITDA Margin",      value:PCT(cur.ebitda/cur.revenue*100),desc:"EBITDA / Revenue",color:"text-blue-400"},
    {label:"Current Ratio",      value:((bs.assets.cash+bs.assets.ar+bs.assets.inventory)/(bs.liabilities.ap+bs.liabilities.accrued+bs.liabilities.tax_payable+bs.liabilities.short_loans)).toFixed(2),desc:"Current Assets / Current Liabilities",color:"text-teal-400"},
    {label:"Debt-to-Equity",     value:(totalLiab/equity).toFixed(2),  desc:"Total Liabilities / Equity",color:"text-amber-400"},
    {label:"Return on Equity",   value:PCT(PNL_MONTHLY.reduce((s,m)=>s+m.net,0)/equity*100),desc:"Net Income YTD / Equity",color:"text-pink-400"},
    {label:"Revenue Growth MoM", value:`${trend(cur.revenue,prev.revenue)}%`,desc:"vs previous month",color:parseFloat(trend(cur.revenue,prev.revenue))>0?"text-green-400":"text-red-400"},
    {label:"Net Income Growth",  value:`${trend(cur.net,prev.net)}%`,desc:"vs previous month",color:parseFloat(trend(cur.net,prev.net))>0?"text-green-400":"text-red-400"},
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map(k=>(
        <div key={k.label} className="erp-card p-4">
          <p className="text-xs text-gray-500 mb-2">{k.label}</p>
          <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          <p className="text-xs text-gray-600 mt-1">{k.desc}</p>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState("pnl");
  const TABS = [
    { key:"pnl",     label:"P&L Statement",  icon:"📈" },
    { key:"bs",      label:"Balance Sheet",   icon:"⚖️" },
    { key:"kpis",    label:"KPIs",            icon:"🎯" },
  ];

  return (
    <div>
      <PageHeader title="Financial Reports" subtitle="Real-time — no month-end close"
        actions={<Btn variant="secondary">📤 Export All</Btn>} />

      <div className="flex gap-2 mb-6 border-b border-gray-800 pb-0">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab===t.key?"border-blue-500 text-white":"border-transparent text-gray-500 hover:text-gray-300"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==="pnl"  && <PnLReport />}
      {tab==="bs"   && <BalanceSheetReport />}
      {tab==="kpis" && <KPIReport />}
    </div>
  );
}
