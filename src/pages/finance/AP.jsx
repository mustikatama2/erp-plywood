import { useState } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, DATE, badge } from "../../lib/fmt";
import { AP_INVOICES, VENDORS } from "../../data/seed";

export default function AP() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const enriched = AP_INVOICES.map(i => ({
    ...i, vendor: VENDORS.find(v=>v.id===i.vendor_id),
  }));

  const STATUSES = ["All","Unpaid","Overdue","Paid"];
  const filtered = enriched
    .filter(i=>filter==="All"||i.status===filter)
    .filter(i=>i.inv_no.toLowerCase().includes(search.toLowerCase())||
               i.vendor?.name.toLowerCase().includes(search.toLowerCase()));

  const total   = enriched.reduce((s,i)=>s+i.balance,0);
  const overdue = enriched.filter(i=>i.status==="Overdue").reduce((s,i)=>s+i.balance,0);

  return (
    <div>
      <PageHeader title="Accounts Payable" subtitle="Vendor bills & payment schedule"
        actions={<><Btn variant="secondary">📤 Export</Btn><Btn>+ New Bill</Btn></>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total AP Outstanding" value={IDR(total)}   color="text-amber-300" icon="📥" />
        <KPICard label="Overdue"              value={IDR(overdue)} color="text-red-400"   icon="🔴" />
        <KPICard label="Open Bills"           value={enriched.filter(i=>i.status!=="Paid").length} icon="📄" />
        <KPICard label="Vendors with AP"      value={new Set(enriched.filter(i=>i.balance>0).map(i=>i.vendor_id)).size} icon="🏢" />
      </div>

      <Card>
        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search bill no, vendor…" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${filter===s?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {s} <span className="ml-1 opacity-70">{s==="All"?enriched.length:enriched.filter(i=>i.status===s).length}</span>
              </button>
            ))}
          </div>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key:"inv_no",     label:"Bill No",      render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"vendor",     label:"Vendor",       render:v=>v?.name.split(" ").slice(0,3).join(" ") },
          { key:"date",       label:"Date",         render:DATE },
          { key:"due_date",   label:"Due Date",     render:(v,r)=>{
            const od = new Date(v)<new Date()&&r.status!=="Paid";
            return <span className={od?"text-red-400 font-bold":"text-gray-300"}>{DATE(v)}{od?" ⚠️":""}</span>;
          }},
          { key:"description",label:"Description",  render:v=><span className="text-xs text-gray-400">{v}</span> },
          { key:"total",      label:"Total",        right:true, render:v=><span className="font-mono">{IDR(v)}</span> },
          { key:"balance",    label:"Outstanding",  right:true, render:v=><span className={v>0?"font-black text-amber-300":"text-gray-500"}>{IDR(v)}</span> },
          { key:"status",     label:"Status",       render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={`Bill ${selected.inv_no}`} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Vendor",selected.vendor?.name],["Bill Date",DATE(selected.date)],
                ["Due Date",DATE(selected.due_date)],["Description",selected.description],
                ["Total",IDR(selected.total)],["Paid",IDR(selected.paid)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
            <div className="erp-card p-4 flex justify-between items-center">
              <span>Amount Due</span>
              <span className={`text-2xl font-black ${selected.balance>0?"text-amber-300":"text-green-400"}`}>{IDR(selected.balance)}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="success">Record Payment</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
