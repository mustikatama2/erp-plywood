import { useState } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, DATE, badge, exportCSV } from "../../lib/fmt";
import { AR_INVOICES, CUSTOMERS } from "../../data/seed";

export default function AR() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const FX = 15560;

  const enriched = AR_INVOICES.map(i => ({
    ...i,
    customer: CUSTOMERS.find(c=>c.id===i.customer_id),
    balance_idr: i.balance * (i.currency==="USD"?FX:1),
  }));

  const STATUSES = ["All","Unpaid","Partial","Overdue","Paid"];
  const filtered = enriched
    .filter(i => filter==="All" || i.status===filter)
    .filter(i => i.inv_no.toLowerCase().includes(search.toLowerCase()) ||
                 i.customer?.name.toLowerCase().includes(search.toLowerCase()));

  const total    = enriched.reduce((s,i)=>s+i.balance_idr, 0);
  const overdue  = enriched.filter(i=>i.status==="Overdue").reduce((s,i)=>s+i.balance_idr,0);
  const paid30   = enriched.filter(i=>i.status==="Paid").reduce((s,i)=>s+i.total_idr,0);

  return (
    <div>
      <PageHeader title="Accounts Receivable" subtitle="Customer invoices & aging"
        actions={<><Btn variant="secondary" onClick={()=>exportCSV(enriched.map(i=>({...i,customer:i.customer?.name})),"ar.csv")}>📤 Export</Btn><Btn>+ New Invoice</Btn></>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total AR Outstanding" value={IDR(total)}   color="text-amber-300" icon="📤" />
        <KPICard label="Overdue"              value={IDR(overdue)} color="text-red-400"   icon="🔴" sub={`${enriched.filter(i=>i.status==="Overdue").length} invoices`} />
        <KPICard label="Open Invoices"        value={enriched.filter(i=>i.status!=="Paid").length} icon="📄" />
        <KPICard label="Customers with AR"    value={new Set(enriched.filter(i=>i.balance>0).map(i=>i.customer_id)).size} icon="👥" />
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoice, customer…" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${filter===s?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {s}
                <span className="ml-1.5 text-xs opacity-70">{s==="All"?enriched.length:enriched.filter(i=>i.status===s).length}</span>
              </button>
            ))}
          </div>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key:"inv_no",    label:"Invoice No",  render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"customer",  label:"Customer",    render:v=>v?.name.split(" ").slice(0,3).join(" ") },
          { key:"date",      label:"Date",        render:DATE },
          { key:"due_date",  label:"Due Date",    render:(v,r)=>{
            const overdue = new Date(v) < new Date() && r.status!=="Paid";
            return <span className={overdue?"text-red-400 font-bold":"text-gray-300"}>{DATE(v)}{overdue?" ⚠️":""}</span>;
          }},
          { key:"currency",  label:"Ccy"          },
          { key:"total",     label:"Invoice Total",right:true, render:(v,r)=><span className="font-mono">{r.currency} {v.toLocaleString()}</span> },
          { key:"balance",   label:"Balance",      right:true, render:(v,r)=><span className={v>0?"font-black text-amber-300":"text-gray-500"}>{r.currency} {v.toLocaleString()}</span> },
          { key:"status",    label:"Status",       render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={`Invoice ${selected.inv_no}`} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Customer",selected.customer?.name],["Invoice Date",DATE(selected.date)],
                ["Due Date",DATE(selected.due_date)],["Currency",selected.currency],
                ["Invoice Total",`${selected.currency} ${selected.total.toLocaleString()}`],
                ["Amount Paid",`${selected.currency} ${selected.paid.toLocaleString()}`]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="erp-card p-4 flex justify-between items-center">
              <span>Balance Outstanding</span>
              <span className={`text-2xl font-black ${selected.balance>0?"text-amber-300":"text-green-400"}`}>
                {selected.currency} {selected.balance.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="success">Record Payment</Btn>
              <Btn variant="secondary">Send Reminder</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
