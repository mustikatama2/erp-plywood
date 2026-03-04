import { useState } from "react";
import { PageHeader, Card, Btn, SearchBar } from "../../components/ui";
import { IDR } from "../../lib/fmt";
import { ACCOUNTS } from "../../data/seed";

const DEMO_ENTRIES = [
  { no:"JE-2026-0891", date:"2026-03-04", desc:"Customer payment — Yamamoto SO-2026-0142",
    lines:[{acc:"1110",name:"Bank BCA — IDR",debit:661250000,credit:0},{acc:"1200",name:"Accounts Receivable",debit:0,credit:661250000}] },
  { no:"JE-2026-0890", date:"2026-03-03", desc:"Vendor payment — PT. Rimba Kalimantan",
    lines:[{acc:"2100",name:"Accounts Payable",debit:76000000,credit:0},{acc:"1110",name:"Bank BCA — IDR",debit:0,credit:76000000}] },
  { no:"JE-2026-0889", date:"2026-03-03", desc:"Sales invoice — INV-2026-0201",
    lines:[{acc:"1200",name:"Accounts Receivable",debit:661250000,credit:0},{acc:"4100",name:"Sales — Plywood Export",debit:0,credit:661250000}] },
  { no:"JE-2026-0888", date:"2026-03-02", desc:"Purchase invoice — PT. Kayu Nusantara",
    lines:[{acc:"1300",name:"Inventory — Raw Material",debit:42000000,credit:0},{acc:"2100",name:"Accounts Payable",debit:0,credit:42000000}] },
  { no:"JE-2026-0887", date:"2026-03-01", desc:"Payroll — February 2026",
    lines:[{acc:"6100",name:"Salaries & Wages",debit:285000000,credit:0},{acc:"1120",name:"Bank Mandiri — IDR",debit:0,credit:285000000}] },
];

export default function Ledger() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(null);

  const filtered = DEMO_ENTRIES.filter(e =>
    e.no.toLowerCase().includes(search.toLowerCase()) ||
    e.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="General Ledger" subtitle="Journal entries"
        actions={<><Btn variant="secondary">📤 Export</Btn><Btn>+ Manual Entry</Btn></>} />

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search entry no, description…" /></div>
        <table className="erp-table">
          <thead><tr><th>Entry No</th><th>Date</th><th>Description</th><th className="text-right">Total Debit</th><th>Status</th></tr></thead>
          <tbody>
            {filtered.map(e => {
              const tot = e.lines.reduce((s,l)=>s+l.debit,0);
              return (
                <tr key={e.no} className="cursor-pointer" onClick={()=>setOpen(open===e.no?null:e.no)}>
                  <td><span className="font-mono font-bold text-blue-400">{e.no}</span></td>
                  <td className="text-gray-400 text-xs">{e.date}</td>
                  <td>{e.desc}</td>
                  <td className="text-right font-mono">{IDR(tot)}</td>
                  <td><span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">Posted</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {open && (() => {
        const e = DEMO_ENTRIES.find(x=>x.no===open);
        if (!e) return null;
        return (
          <div className="mt-4">
            <Card title={`${e.no} — ${e.desc}`} action={<Btn size="xs" variant="ghost" onClick={()=>setOpen(null)}>✕ Close</Btn>}>
              <table className="erp-table">
                <thead><tr><th>Account</th><th>Account Name</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead>
                <tbody>
                  {e.lines.map((l,i)=>(
                    <tr key={i}>
                      <td><span className="font-mono text-blue-400">{l.acc}</span></td>
                      <td>{l.name}</td>
                      <td className="text-right font-mono text-green-400">{l.debit>0?IDR(l.debit):"—"}</td>
                      <td className="text-right font-mono text-red-400">{l.credit>0?IDR(l.credit):"—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-black text-gray-300">
                    <td colSpan={2} className="px-4 py-2">Total</td>
                    <td className="text-right px-4 py-2 text-green-400">{IDR(e.lines.reduce((s,l)=>s+l.debit,0))}</td>
                    <td className="text-right px-4 py-2 text-red-400">{IDR(e.lines.reduce((s,l)=>s+l.credit,0))}</td>
                  </tr>
                </tfoot>
              </table>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
