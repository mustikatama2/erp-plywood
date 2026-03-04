import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, DATE, badge } from "../../lib/fmt";
import { CUSTOMERS, AR_INVOICES, SALES_ORDERS } from "../../data/seed";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const enriched = CUSTOMERS.map(c => ({
    ...c,
    open_invoices: AR_INVOICES.filter(i => i.customer_id===c.id && i.status!=="Paid").length,
    total_so: SALES_ORDERS.filter(s => s.customer_id===c.id).length,
  }));

  const filtered = enriched.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Customers" subtitle={`${CUSTOMERS.length} registered`}
        actions={<Btn>+ Add Customer</Btn>} />
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Search name, code, country…" />
          <div className="flex gap-2 text-xs text-gray-500">
            <span>{CUSTOMERS.filter(c=>c.status==="Active").length} active</span>
            <span>·</span>
            <span>{CUSTOMERS.length} total</span>
          </div>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",    label:"Code",    render:v=><span className="font-mono text-xs text-gray-400">{v}</span> },
          { key:"name",    label:"Customer" },
          { key:"country", label:"Country"  },
          { key:"payment_terms", label:"Payment Terms" },
          { key:"ar_balance",    label:"AR Balance",   right:true, render:(v,r)=><span className={v>0?"font-bold text-amber-300":"text-gray-400"}>{r.currency} {v.toLocaleString()}</span> },
          { key:"credit_limit",  label:"Credit Limit", right:true, render:(v,r)=><span className="text-gray-500">{IDR(v)}</span> },
          { key:"open_invoices", label:"Open Inv.",    right:true, render:v=>v>0?<span className="text-amber-400 font-bold">{v}</span>:<span className="text-gray-600">0</span> },
          { key:"status",  label:"Status",  render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.name} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[["Code",selected.code],["Country",selected.country],["Contact",selected.contact],
                ["Email",selected.email],["Phone",selected.phone],["Currency",selected.currency],
                ["Payment Terms",selected.payment_terms],["Credit Limit",IDR(selected.credit_limit)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
            <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4 text-center">
              <div className="erp-card p-3">
                <p className="text-2xl font-black text-amber-300">{selected.currency} {selected.ar_balance.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">AR Balance</p>
              </div>
              <div className="erp-card p-3">
                <p className="text-2xl font-black text-white">{selected.total_so}</p>
                <p className="text-xs text-gray-500 mt-1">Sales Orders</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn>+ New SO</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
