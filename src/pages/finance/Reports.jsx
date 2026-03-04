import { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { PageHeader, Card, Btn, KPICard } from "../../components/ui";
import { IDR, PCT, NUM, exportCSV } from "../../lib/fmt";
import { PNL_MONTHLY, BALANCE_SHEET, ACCOUNTS } from "../../data/seed";
import { useJournal } from "../../contexts/JournalContext";

const TT = { contentStyle:{background:"#111827",border:"1px solid #374151",borderRadius:8}, labelStyle:{color:"#f3f4f6"} };

function PnLReport({ data = PNL_MONTHLY, journalSummary = null }) {
  const cur = data[data.length-1] || PNL_MONTHLY[PNL_MONTHLY.length-1];
  const ytd = data.reduce((a,m)=>({
    revenue:a.revenue+m.revenue, cogs:a.cogs+m.cogs, gross:a.gross+m.gross,
    opex:a.opex+m.opex, ebitda:a.ebitda+m.ebitda, net:a.net+m.net
  }), {revenue:0,cogs:0,gross:0,opex:0,ebitda:0,net:0});

  // If journal has data, overlay it on the YTD summary
  const liveRevenue   = journalSummary?.revenue    || 0;
  const liveCOGS      = journalSummary?.cogs        || 0;
  const liveExpenses  = journalSummary?.totalExpenses || 0;
  const liveGross     = journalSummary?.grossProfit || 0;
  const liveNet       = journalSummary?.netIncome   || 0;
  const liveCount     = journalSummary?.entryCount  || 0;
  const hasLiveData   = liveRevenue > 0;

  const Row = ({label,value,pct,bold,indent,color="text-gray-700"}) => (
    <div className={`flex justify-between py-2 border-b border-gray-200/50 text-sm ${bold?"font-black text-gray-900":""}`}>
      <span className={`${indent?"ml-5 text-gray-400":""} ${color}`}>{label}</span>
      <div className="flex gap-8 text-right">
        <span className="w-32 font-mono">{IDR(value)}</span>
        {pct!=null&&<span className={`w-16 text-xs ${pct>=20?"text-green-700":pct>=10?"text-amber-700":"text-red-700"}`}>{PCT(pct)}</span>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Live / static banner */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm border ${
        hasLiveData
          ? "bg-green-500/8 border-green-500/20 text-green-700"
          : "bg-amber-500/8 border-amber-500/20 text-amber-700"
      }`}>
        <span>{hasLiveData ? "📊" : "📋"}</span>
        <span className="font-medium">
          {hasLiveData
            ? `Berdasarkan ${liveCount} jurnal entries (live data dari General Ledger)`
            : "Data contoh (belum ada transaksi — tambah invoice untuk melihat data live)"}
        </span>
      </div>

      {/* Monthly trend */}
      <Card title="Revenue & Profit Trend (Rp Juta)">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.map(m=>({
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
      <Card title={hasLiveData ? "Profit & Loss Statement — Live (dari Jurnal)" : "Profit & Loss Statement — Year to Date 2026"}
        action={<Btn size="xs" variant="secondary" onClick={() => window.print()}>📤 Export PDF</Btn>}>
        <div className="px-0">
          <div className="flex justify-between text-xs text-gray-500 mb-2 px-0 border-b border-gray-200 pb-2 font-bold uppercase tracking-wider">
            <span>Description</span>
            <div className="flex gap-8 text-right">
              <span className="w-32">{hasLiveData ? "Live (Jurnal)" : "YTD 2026"}</span>
              <span className="w-16">Margin</span>
            </div>
          </div>
          {hasLiveData ? (
            <>
              <Row label="Net Revenue"        value={liveRevenue} pct={100} bold />
              <Row label="Cost of Goods Sold" value={liveCOGS} pct={liveRevenue ? liveCOGS/liveRevenue*100 : 0} indent color="text-red-700" />
              <Row label="Gross Profit"       value={liveGross} pct={liveRevenue ? liveGross/liveRevenue*100 : 0} bold color="text-green-700" />
              <Row label="Operating Expenses" value={liveExpenses} indent color="text-red-700" />
              <Row label="Net Income"         value={liveNet} pct={liveRevenue ? liveNet/liveRevenue*100 : 0} bold color="text-purple-700" />
            </>
          ) : (
            <>
              <Row label="Net Revenue"          value={ytd.revenue} pct={100}                    bold />
              <Row label="Cost of Goods Sold"   value={ytd.cogs}    pct={ytd.cogs/ytd.revenue*100} indent color="text-red-700" />
              <Row label="Gross Profit"         value={ytd.gross}   pct={ytd.gross/ytd.revenue*100} bold color="text-green-700" />
              <Row label="Operating Expenses"   value={ytd.opex}    indent color="text-red-700" />
              <Row label="EBITDA"               value={ytd.ebitda}  pct={ytd.ebitda/ytd.revenue*100} bold color="text-blue-700" />
              <Row label="Interest Expense"     value={PNL_MONTHLY.reduce((s,m)=>s+m.interest,0)} indent color="text-red-700" />
              <Row label="Income Tax"           value={PNL_MONTHLY.reduce((s,m)=>s+m.tax,0)}      indent color="text-red-700" />
              <Row label="Net Income"           value={ytd.net}     pct={ytd.net/ytd.revenue*100} bold color="text-purple-700" />
            </>
          )}
        </div>
      </Card>

      {/* Month summary table */}
      <Card title="Monthly Detail">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead><tr><th>Month</th><th className="text-right">Revenue</th><th className="text-right">Gross Profit</th><th className="text-right">GPM</th><th className="text-right">Net Income</th><th className="text-right">NPM</th></tr></thead>
            <tbody>
              {data.map(m=>(
                <tr key={m.month}>
                  <td className="font-medium">{m.month}</td>
                  <td className="text-right font-mono">{IDR(m.revenue)}</td>
                  <td className="text-right font-mono text-green-700">{IDR(m.gross)}</td>
                  <td className="text-right"><span className={`text-xs font-bold ${m.gross/m.revenue>0.28?"text-green-700":"text-amber-700"}`}>{PCT(m.gross/m.revenue*100)}</span></td>
                  <td className="text-right font-mono text-purple-700">{IDR(m.net)}</td>
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

  const Section = ({title, items, total, color="text-gray-900"}) => (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mt-4 mb-2">{title}</p>
      {items.map(([k,v])=>(
        <div key={k} className="flex justify-between py-1.5 border-b border-gray-200/40 text-sm">
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
      <Card title="Assets" action={<Btn size="xs" variant="secondary" onClick={() => window.print()}>📤 PDF</Btn>}>
        <Section title="Current Assets" color="text-blue-700" total={bs.assets.cash+bs.assets.ar+bs.assets.inventory+bs.assets.prepaid}
          items={[["Cash & Bank",bs.assets.cash],["Accounts Receivable",bs.assets.ar],["Inventory",bs.assets.inventory],["Prepaid Expenses",bs.assets.prepaid]]} />
        <Section title="Fixed Assets" color="text-teal-400" total={bs.assets.fixed_net}
          items={[["Fixed Assets (net of depreciation)",bs.assets.fixed_net]]} />
        <div className="flex justify-between py-3 text-lg font-black text-green-700 border-t border-gray-200 mt-2">
          <span>TOTAL ASSETS</span><span>{IDR(totalAssets)}</span>
        </div>
      </Card>

      <Card title="Liabilities & Equity">
        <Section title="Current Liabilities" color="text-red-700" total={bs.liabilities.ap+bs.liabilities.accrued+bs.liabilities.tax_payable+bs.liabilities.short_loans}
          items={[["Accounts Payable",bs.liabilities.ap],["Accrued Liabilities",bs.liabilities.accrued],["Tax Payable",bs.liabilities.tax_payable],["Short-term Loans",bs.liabilities.short_loans]]} />
        <Section title="Long-term Liabilities" color="text-orange-400" total={bs.liabilities.long_loans}
          items={[["Bank Loans",bs.liabilities.long_loans]]} />
        <Section title="Equity" color="text-purple-700" total={totalEquity}
          items={[["Paid-in Capital",bs.equity.paid_in],["Retained Earnings",bs.equity.retained]]} />
        <div className="flex justify-between py-3 text-lg font-black text-green-700 border-t border-gray-200 mt-2">
          <span>TOTAL L + E</span><span>{IDR(totalLiab+totalEquity)}</span>
        </div>
        {Math.abs(totalAssets-(totalLiab+totalEquity)) < 1000 && (
          <div className="mt-2 text-xs text-green-700 text-center">✅ Balance sheet is balanced</div>
        )}
      </Card>
    </div>
  );
}

function KPIReport({ data = PNL_MONTHLY }) {
  const cur  = data[data.length-1]  || PNL_MONTHLY[PNL_MONTHLY.length-1];
  const prev = data[data.length-2]  || PNL_MONTHLY[PNL_MONTHLY.length-2];
  const trend = (a,b) => ((a-b)/b*100).toFixed(1);
  const bs = BALANCE_SHEET;
  const totalAssets = Object.values(bs.assets).reduce((a,b)=>a+b,0);
  const totalLiab = Object.values(bs.liabilities).reduce((a,b)=>a+b,0);
  const equity = Object.values(bs.equity).reduce((a,b)=>a+b,0);
  const kpis = [
    {label:"Gross Profit Margin",value:PCT(cur.gross/cur.revenue*100),desc:"Revenue − COGS / Revenue",color:"text-green-700"},
    {label:"Net Profit Margin",  value:PCT(cur.net/cur.revenue*100),  desc:"Net income / Revenue",color:"text-purple-700"},
    {label:"EBITDA Margin",      value:PCT(cur.ebitda/cur.revenue*100),desc:"EBITDA / Revenue",color:"text-blue-700"},
    {label:"Current Ratio",      value:((bs.assets.cash+bs.assets.ar+bs.assets.inventory)/(bs.liabilities.ap+bs.liabilities.accrued+bs.liabilities.tax_payable+bs.liabilities.short_loans)).toFixed(2),desc:"Current Assets / Current Liabilities",color:"text-teal-400"},
    {label:"Debt-to-Equity",     value:(totalLiab/equity).toFixed(2),  desc:"Total Liabilities / Equity",color:"text-amber-700"},
    {label:"Return on Equity",   value:PCT(PNL_MONTHLY.reduce((s,m)=>s+m.net,0)/equity*100),desc:"Net Income YTD / Equity",color:"text-pink-400"},
    {label:"Revenue Growth MoM", value:`${trend(cur.revenue,prev.revenue)}%`,desc:"vs previous month",color:parseFloat(trend(cur.revenue,prev.revenue))>0?"text-green-700":"text-red-700"},
    {label:"Net Income Growth",  value:`${trend(cur.net,prev.net)}%`,desc:"vs previous month",color:parseFloat(trend(cur.net,prev.net))>0?"text-green-700":"text-red-700"},
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

// ── Trial Balance ─────────────────────────────────────────────────────────────
function TrialBalance() {
  const journal = useJournal();
  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);

  const rows = useMemo(() => journal.getTrialBalance(), [journal]);

  // Group by account type
  const groups = useMemo(() => {
    const map = { asset: [], liability: [], equity: [], revenue: [], expense: [], unknown: [] };
    for (const r of rows) {
      const g = map[r.type] || map.unknown;
      g.push(r);
    }
    return map;
  }, [rows]);

  const totalDebit  = rows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 1;

  const GROUP_LABELS = {
    asset: "Aset",
    liability: "Liabilitas",
    equity: "Ekuitas",
    revenue: "Pendapatan",
    expense: "Beban",
    unknown: "Lainnya",
  };

  const exportData = rows.map(r => ({
    account_code: r.acc,
    account_name: r.name,
    type: r.type,
    debit: r.debit,
    credit: r.credit,
    net_balance: r.balance,
  }));

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Per tanggal:</span>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)}
            className="erp-input text-sm py-1.5" />
        </div>
        <Btn variant="secondary" size="xs" onClick={() => exportCSV(exportData, "trial_balance.csv")}>
          📤 Export CSV
        </Btn>
      </div>

      {/* Balance status */}
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm border ${
        isBalanced
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}>
        <span className="text-lg">{isBalanced ? "✅" : "⚠️"}</span>
        <span className="font-semibold">
          {isBalanced
            ? "Trial Balance seimbang — Total Debit = Total Kredit"
            : `Trial Balance TIDAK seimbang — Selisih: ${IDR(Math.abs(totalDebit - totalCredit))}`}
        </span>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs uppercase tracking-wider text-gray-500 font-bold w-20">Kode</th>
                <th className="text-left py-2.5 px-3 text-xs uppercase tracking-wider text-gray-500 font-bold">Nama Akun</th>
                <th className="text-left py-2.5 px-3 text-xs uppercase tracking-wider text-gray-500 font-bold w-24">Tipe</th>
                <th className="text-right py-2.5 px-3 text-xs uppercase tracking-wider text-gray-500 font-bold w-36">Debit</th>
                <th className="text-right py-2.5 px-3 text-xs uppercase tracking-wider text-gray-500 font-bold w-36">Kredit</th>
                <th className="text-right py-2.5 px-3 text-xs uppercase tracking-wider text-gray-500 font-bold w-36">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([type, items]) => {
                if (!items.length) return null;
                return [
                  <tr key={`hdr-${type}`} className="bg-gray-50">
                    <td colSpan={6} className="py-2 px-3 text-xs font-black uppercase tracking-wider text-gray-600">
                      {GROUP_LABELS[type] || type}
                    </td>
                  </tr>,
                  ...items.map(r => (
                    <tr key={r.acc} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs text-blue-700 font-bold">{r.acc}</td>
                      <td className="py-2 px-3 text-gray-700">{r.name}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          type === "asset"     ? "bg-blue-50 text-blue-700" :
                          type === "liability" ? "bg-red-50 text-red-700" :
                          type === "equity"    ? "bg-purple-50 text-purple-700" :
                          type === "revenue"   ? "bg-green-50 text-green-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>{type}</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-700">
                        {r.debit > 0 ? IDR(r.debit) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-gray-700">
                        {r.credit > 0 ? IDR(r.credit) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className={`py-2 px-3 text-right font-mono font-bold ${
                        r.balance > 0 ? "text-blue-700" : r.balance < 0 ? "text-red-700" : "text-gray-400"
                      }`}>{IDR(r.balance)}</td>
                    </tr>
                  )),
                ];
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-black">
                <td className="py-3 px-3 text-xs uppercase tracking-wider text-gray-700" colSpan={3}>TOTAL</td>
                <td className="py-3 px-3 text-right font-mono text-gray-900 text-sm">{IDR(totalDebit)}</td>
                <td className="py-3 px-3 text-right font-mono text-gray-900 text-sm">{IDR(totalCredit)}</td>
                <td className={`py-3 px-3 text-right font-mono text-sm ${isBalanced ? "text-green-700" : "text-red-700"}`}>
                  {IDR(totalDebit - totalCredit)} {isBalanced ? "✅" : "⚠️"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Cash Flow Statement ────────────────────────────────────────────────────────
function CashFlowStatement() {
  const journal = useJournal();
  const bs = BALANCE_SHEET;

  const pnl = useMemo(() => journal.getPnL(), [journal]);

  // Operating cash flow (indirect method)
  const netIncome      = pnl.netIncome || 0;
  const depreciation   = 350000000; // est. from ASSETS
  const changeAR       = -(bs.assets.ar - 650000000);   // decrease = positive
  const changeInventory= -(bs.assets.inventory - 1800000000);
  const changeAP       = bs.liabilities.ap - 480000000;  // increase = positive
  const changeAccrued  = bs.liabilities.accrued - 120000000;
  const operatingCF    = netIncome + depreciation + changeAR + changeInventory + changeAP + changeAccrued;

  // Investing CF
  const capex          = -1200000000; // purchase of machinery
  const investingCF    = capex;

  // Financing CF
  const loanRepayment  = -450000000;
  const dividends      = 0;
  const financingCF    = loanRepayment + dividends;

  const netChange      = operatingCF + investingCF + financingCF;
  const beginCash      = 1200000000;
  const endCash        = beginCash + netChange;

  const Section = ({ title, rows, total, totalColor = "text-gray-900" }) => (
    <div className="mb-6">
      <p className="text-sm font-black text-gray-700 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200">{title}</p>
      <div className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5 text-sm border-b border-gray-100">
            <span className="text-gray-500 ml-4">{label}</span>
            <span className={`font-mono ${value >= 0 ? "text-green-700" : "text-red-700"}`}>
              {value >= 0 ? "" : "("}{IDR(Math.abs(value))}{value < 0 ? ")" : ""}
            </span>
          </div>
        ))}
        <div className={`flex justify-between py-2 text-sm font-black border-t-2 border-gray-300 ${totalColor}`}>
          <span>Total {title}</span>
          <span className="font-mono">{total >= 0 ? "" : "("}{IDR(Math.abs(total))}{total < 0 ? ")" : ""}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <Card title="Laporan Arus Kas — 2026 YTD"
        action={<Btn size="xs" variant="secondary" onClick={() => window.print()}>📤 PDF</Btn>}>
        <div className="max-w-2xl">
          {/* Operating */}
          <Section
            title="Aktivitas Operasi"
            totalColor={operatingCF >= 0 ? "text-green-700" : "text-red-700"}
            total={operatingCF}
            rows={[
              ["Laba Bersih", netIncome],
              ["Penyusutan & Amortisasi", depreciation],
              ["Perubahan Piutang Dagang (AR)", changeAR],
              ["Perubahan Persediaan", changeInventory],
              ["Perubahan Hutang Dagang (AP)", changeAP],
              ["Perubahan Liabilitas Akrual", changeAccrued],
            ]}
          />
          {/* Investing */}
          <Section
            title="Aktivitas Investasi"
            totalColor={investingCF >= 0 ? "text-green-700" : "text-red-700"}
            total={investingCF}
            rows={[
              ["Pembelian Aset Tetap (CAPEX)", capex],
            ]}
          />
          {/* Financing */}
          <Section
            title="Aktivitas Pendanaan"
            totalColor={financingCF >= 0 ? "text-green-700" : "text-red-700"}
            total={financingCF}
            rows={[
              ["Cicilan Pinjaman Bank", loanRepayment],
              ["Dividen Dibayar", dividends],
            ]}
          />

          {/* Summary */}
          <div className="border-t-2 border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saldo Kas Awal Periode</span>
              <span className="font-mono font-bold text-gray-700">{IDR(beginCash)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kenaikan / (Penurunan) Bersih</span>
              <span className={`font-mono font-bold ${netChange >= 0 ? "text-green-700" : "text-red-700"}`}>
                {netChange >= 0 ? "" : "("}{IDR(Math.abs(netChange))}{netChange < 0 ? ")" : ""}
              </span>
            </div>
            <div className="flex justify-between text-lg font-black border-t border-gray-200 pt-2">
              <span className="text-gray-900">Saldo Kas Akhir Periode</span>
              <span className="font-mono text-blue-700">{IDR(endCash)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Visual bar */}
      <Card title="Ringkasan Arus Kas">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={[
            { name: "Operasi",  value: operatingCF / 1e6 },
            { name: "Investasi",value: investingCF / 1e6 },
            { name: "Pendanaan",value: financingCF / 1e6 },
            { name: "Net",      value: netChange / 1e6 },
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
            <Tooltip formatter={(v) => [`Rp ${v.toFixed(0)}jt`, "Arus Kas"]}
              contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {[operatingCF, investingCF, financingCF, netChange].map((v, i) => (
                <Cell key={i} fill={v >= 0 ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── Period Picker ─────────────────────────────────────────────────────────────

const PRESETS = [
  { key:"1m",  label:"Bulan Ini" },
  { key:"3m",  label:"3 Bulan"   },
  { key:"6m",  label:"6 Bulan"   },
  { key:"ytd", label:"YTD 2026"  },
  { key:"all", label:"Semua Data"},
];

function PeriodPicker({ preset, onPreset, startMonth, endMonth, onStartMonth, onEndMonth }) {
  const months = PNL_MONTHLY.map(m => m.month);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Preset buttons */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-light)' }}>
        {PRESETS.map(p => (
          <button key={p.key} onClick={() => onPreset(p.key)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
              preset === p.key ? "text-gray-950 font-bold" : "text-gray-400 hover:text-gray-800"
            }`}
            style={preset === p.key ? { background: 'var(--gold)' } : {}}>
            {p.label}
          </button>
        ))}
      </div>
      {/* Manual range */}
      <div className="flex items-center gap-1.5">
        <select value={startMonth} onChange={e => { onPreset("custom"); onStartMonth(e.target.value); }}
          className="erp-select text-xs py-1.5 w-auto min-w-0" style={{ paddingRight: 28 }}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-gray-600 text-xs">→</span>
        <select value={endMonth} onChange={e => { onPreset("custom"); onEndMonth(e.target.value); }}
          className="erp-select text-xs py-1.5 w-auto min-w-0" style={{ paddingRight: 28 }}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </div>
  );
}

function filterByPeriod(data, preset, startMonth, endMonth) {
  const all = data;
  const idx = (m) => all.findIndex(x => x.month === m);
  if (preset === "1m") return all.slice(-1);
  if (preset === "3m") return all.slice(-3);
  if (preset === "6m") return all.slice(-6);
  if (preset === "ytd") return all.filter(m => m.month.includes("2026"));
  if (preset === "custom") {
    const s = idx(startMonth), e = idx(endMonth);
    if (s < 0 || e < 0) return all;
    return s <= e ? all.slice(s, e + 1) : all.slice(e, s + 1);
  }
  return all;
}

export default function Reports() {
  const journal = useJournal();

  const [tab, setTab] = useState("pnl");
  const [preset, setPreset] = useState("6m");
  const [startMonth, setStartMonth] = useState(PNL_MONTHLY[0]?.month || "");
  const [endMonth,   setEndMonth]   = useState(PNL_MONTHLY[PNL_MONTHLY.length-1]?.month || "");

  const handlePreset = (p) => {
    setPreset(p);
    if (p !== "custom") {
      setStartMonth(PNL_MONTHLY[0]?.month);
      setEndMonth(PNL_MONTHLY[PNL_MONTHLY.length-1]?.month);
    }
  };

  const filteredData = filterByPeriod(PNL_MONTHLY, preset, startMonth, endMonth);

  // Live journal P&L
  const journalSummary = useMemo(() => journal.getPnL(), [journal]);

  const TABS = [
    { key:"pnl",     label:"P&L Statement",  icon:"📈" },
    { key:"bs",      label:"Balance Sheet",   icon:"🏦" },
    { key:"kpis",    label:"KPIs",            icon:"🎯" },
    { key:"tb",      label:"Trial Balance",   icon:"⚖️" },
    { key:"cf",      label:"Cash Flow",       icon:"💧" },
  ];

  return (
    <div>
      <PageHeader title="Laporan Keuangan" subtitle="Financial Reports — Mustikatama Group"
        actions={<Btn variant="secondary" onClick={() => exportCSV(filteredData, "laporan_keuangan.csv")}>📤 Export CSV</Btn>} />

      {/* Period picker — persistent across all tabs */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-3 p-3 rounded-xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Periode:</span>
          <PeriodPicker
            preset={preset} onPreset={handlePreset}
            startMonth={startMonth} endMonth={endMonth}
            onStartMonth={setStartMonth} onEndMonth={setEndMonth}
          />
        </div>
        <span className="text-xs text-gray-600">
          {filteredData.length} bulan · {filteredData[0]?.month} – {filteredData[filteredData.length-1]?.month}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-0">
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab===t.key?"border-yellow-400 text-gray-900":"border-transparent text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab==="pnl"  && <PnLReport data={filteredData} journalSummary={journalSummary} />}
      {tab==="bs"   && <BalanceSheetReport />}
      {tab==="kpis" && <KPIReport data={filteredData} />}
      {tab==="tb"   && <TrialBalance />}
      {tab==="cf"   && <CashFlowStatement />}
    </div>
  );
}
