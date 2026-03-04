import { PageHeader, Card, KPICard, Btn } from "../../components/ui";
import { IDR, USD } from "../../lib/fmt";
import { BANK_ACCOUNTS } from "../../data/seed";

const DEMO_TXN = [
  { date:"2026-03-04", desc:"Customer payment — Yamamoto Trading", credit:250000000, debit:0,         acc:"BCA — IDR" },
  { date:"2026-03-03", desc:"Vendor payment — PT. Rimba Kalimantan",credit:0,        debit:76000000,  acc:"BCA — IDR" },
  { date:"2026-03-03", desc:"USD inflow — Shanghai Fuhua",          credit:null,     debit:null, usd_credit:45000, acc:"BCA — USD" },
  { date:"2026-03-02", desc:"Payroll transfer to Mandiri",          credit:0,        debit:320000000, acc:"BCA — IDR" },
  { date:"2026-03-01", desc:"Export proceeds — LC settlement",      credit:null,     debit:null, usd_credit:32500, acc:"BCA — USD" },
  { date:"2026-02-28", desc:"Electricity payment — PT. Listrik",   credit:0,        debit:23000000,  acc:"BCA — IDR" },
];

export default function Banks() {
  const totalIDR = BANK_ACCOUNTS.reduce((s,b) => s + (b.currency==="USD"?b.balance*15560:b.balance), 0);

  return (
    <div>
      <PageHeader title="Banks & Cash" actions={<Btn>+ Add Transaction</Btn>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {BANK_ACCOUNTS.map(b => (
          <div key={b.id} className="erp-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                <p className="text-xs text-gray-500">{b.bank}</p>
                <p className="font-mono text-xs text-gray-500 mt-0.5">{b.no}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${b.currency==="USD"?"bg-green-500/20 text-green-700":"bg-blue-500/20 text-blue-700"}`}>{b.currency}</span>
            </div>
            <p className={`text-2xl font-black ${b.currency==="USD"?"text-green-700":"text-gray-900"}`}>
              {b.currency==="USD" ? `$ ${b.balance.toLocaleString()}` : IDR(b.balance)}
            </p>
            {b.currency==="USD" && <p className="text-xs text-gray-500 mt-1">≈ {IDR(b.balance*15560)}</p>}
          </div>
        ))}
      </div>

      <div className="erp-card px-5 py-3 mb-5 flex items-center justify-between">
        <span className="text-gray-400">Total Cash & Bank (IDR equivalent)</span>
        <span className="text-2xl font-black text-teal-400">{IDR(totalIDR)}</span>
      </div>

      <Card title="Recent Transactions">
        <table className="erp-table">
          <thead><tr><th>Date</th><th>Description</th><th>Account</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead>
          <tbody>
            {DEMO_TXN.map((t,i) => (
              <tr key={i}>
                <td className="text-xs text-gray-500">{t.date}</td>
                <td>{t.desc}</td>
                <td className="text-xs text-gray-400">{t.acc}</td>
                <td className="text-right text-red-700">{t.debit>0?IDR(t.debit):t.usd_credit?"":" "}</td>
                <td className="text-right text-green-700">
                  {t.credit>0?IDR(t.credit):t.usd_credit?`$ ${t.usd_credit.toLocaleString()}`:" "}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
