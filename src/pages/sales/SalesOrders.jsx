import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, USD, DATE, badge, exportCSV } from "../../lib/fmt";
import { SALES_ORDERS, CUSTOMERS, PRODUCTS } from "../../data/seed";

export default function SalesOrders() {
  const [orders, setOrders] = useState(SALES_ORDERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = orders.filter(o =>
    o.so_no.toLowerCase().includes(search.toLowerCase()) ||
    CUSTOMERS.find(c=>c.id===o.customer_id)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusSummary = ["Draft","Confirmed","In Progress","Shipped"].map(s => ({
    s, count: orders.filter(o=>o.status===s).length,
    value: orders.filter(o=>o.status===s).reduce((sum,o)=>sum+o.total_idr,0)
  }));

  return (
    <div>
      <PageHeader title="Sales Orders" subtitle={`${orders.length} orders · ${orders.filter(o=>o.status!=="Shipped").length} open`}
        actions={<><Btn variant="secondary" onClick={()=>exportCSV(orders,"sales-orders.csv")}>📤 Export</Btn><Btn>+ New SO</Btn></>} />

      {/* Status strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {statusSummary.map(({s,count,value})=>(
          <div key={s} className="erp-card p-3">
            <p className="text-xs text-gray-500">{s}</p>
            <p className="text-lg font-black text-white">{count}</p>
            <p className="text-xs text-gray-400">{IDR(value)}</p>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search SO no, customer…" />
        </div>
        <Table
          onRowClick={setSelected}
          columns={[
            { key:"so_no",    label:"SO Number",   render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
            { key:"customer_id", label:"Customer", render:(v)=>CUSTOMERS.find(c=>c.id===v)?.name.split(" ").slice(0,3).join(" ") },
            { key:"date",      label:"Date",        render:DATE },
            { key:"delivery_date", label:"Delivery", render:DATE },
            { key:"incoterm",  label:"Incoterm"    },
            { key:"total",     label:"Amount",     right:true, render:(v,row)=><span className="font-bold">{row.currency} {v.toLocaleString()}</span> },
            { key:"status",    label:"Status",      render:v=><Badge status={v} /> },
          ]}
          data={filtered}
        />
      </Card>

      {selected && (
        <Modal title={`${selected.so_no} — ${CUSTOMERS.find(c=>c.id===selected.customer_id)?.name}`} onClose={()=>setSelected(null)} width="max-w-3xl">
          <div className="p-5 space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[["Customer",CUSTOMERS.find(c=>c.id===selected.customer_id)?.name],
                ["Date",DATE(selected.date)],["Delivery",DATE(selected.delivery_date)],
                ["Incoterm",selected.incoterm],["Payment",selected.payment_terms],["Currency",selected.currency],
                ["Status",selected.status],["Notes",selected.notes]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v||"—"}</p></div>
              ))}
            </div>
            {/* Lines */}
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Order Lines</p>
              <table className="erp-table">
                <thead><tr><th>Product</th><th>Qty</th><th className="text-right">Unit Price</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {selected.lines.map(l=>(
                    <tr key={l.id}><td>{l.product}</td><td>{l.qty.toLocaleString()} {l.unit}</td>
                      <td className="text-right">{selected.currency} {l.unit_price.toFixed(2)}</td>
                      <td className="text-right font-bold">{selected.currency} {l.total.toLocaleString()}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr className="font-black text-white">
                  <td colSpan={3} className="text-right px-4 py-2">Total</td>
                  <td className="text-right px-4 py-2">{selected.currency} {selected.total.toLocaleString()}</td>
                </tr></tfoot>
              </table>
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="success">Create Proforma</Btn>
              <Btn>Ship</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
