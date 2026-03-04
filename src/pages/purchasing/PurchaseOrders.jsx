import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, DATE, badge } from "../../lib/fmt";
import { PURCHASE_ORDERS, VENDORS } from "../../data/seed";

export default function PurchaseOrders() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const enriched = PURCHASE_ORDERS.map(po => ({
    ...po, vendor: VENDORS.find(v => v.id === po.vendor_id),
  }));
  const filtered = enriched.filter(po =>
    po.po_no.toLowerCase().includes(search.toLowerCase()) ||
    po.vendor?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle={`${PURCHASE_ORDERS.length} orders`}
        actions={<Btn>+ New PO</Btn>} />
      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search PO no, vendor…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"po_no",  label:"PO Number",  render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"vendor", label:"Vendor",     render:v=>v?.name },
          { key:"date",   label:"Date",       render:DATE },
          { key:"delivery_date",label:"Delivery",render:DATE },
          { key:"total",  label:"Total (IDR)",right:true, render:v=><span className="font-bold">{IDR(v)}</span> },
          { key:"status", label:"Status",     render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>
      {selected && (
        <Modal title={selected.po_no} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Vendor",selected.vendor?.name],["Date",DATE(selected.date)],
                ["Delivery Date",DATE(selected.delivery_date)],["Status",selected.status]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Order Lines</p>
              <table className="erp-table">
                <thead><tr><th>Product</th><th>Qty</th><th className="text-right">Unit Price</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {selected.lines.map((l,i)=>(
                    <tr key={i}><td>{l.product}</td><td>{l.qty.toLocaleString()} {l.unit}</td>
                      <td className="text-right">{IDR(l.unit_price)}</td>
                      <td className="text-right font-bold">{IDR(l.total)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr className="font-black text-white">
                  <td colSpan={3} className="text-right px-4 py-2">Total</td>
                  <td className="text-right px-4 py-2">{IDR(selected.total)}</td>
                </tr></tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="success">Receive Goods</Btn>
              <Btn>Approve</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
