import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, DATE, badge } from "../../lib/fmt";
import { PROFORMAS, CUSTOMERS, COMPANY } from "../../data/seed";

export default function ProformaInvoices() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);

  const enriched = PROFORMAS.map(pi => ({
    ...pi, customer: CUSTOMERS.find(c => c.id === pi.customer_id),
  }));

  const filtered = enriched.filter(pi =>
    pi.pi_no.toLowerCase().includes(search.toLowerCase()) ||
    pi.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Proforma Invoices" subtitle={`${PROFORMAS.length} total`}
        actions={<><Btn variant="secondary">📤 Export</Btn><Btn>+ New PI</Btn></>} />

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search PI no, customer…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"pi_no",   label:"PI Number",  render:v=><span className="font-mono font-bold text-blue-700">{v}</span> },
          { key:"customer",label:"Customer",   render:v=>v?.name },
          { key:"date",    label:"Date",       render:DATE },
          { key:"valid_until",label:"Valid Until",render:(v,r)=>{
            const expired = new Date(v) < new Date();
            return <span className={expired?"text-red-700":"text-gray-700"}>{DATE(v)}{expired?" ⚠️":""}</span>;
          }},
          { key:"payment_terms",label:"Payment Terms" },
          { key:"currency",label:"Currency" },
          { key:"total",   label:"Amount",     right:true, render:(v,r)=><span className="font-bold">{r.currency} {v.toLocaleString()}</span> },
          { key:"status",  label:"Status",     render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.pi_no} onClose={()=>setSelected(null)} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Customer",selected.customer?.name],["Date",DATE(selected.date)],
                ["Valid Until",DATE(selected.valid_until)],["Payment Terms",selected.payment_terms],
                ["Bank Details",selected.bank_details],["Status",selected.status]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v||"—"}</p></div>
              ))}
            </div>
            {selected.notes && <div className="bg-gray-50 rounded p-3 text-sm text-gray-400">{selected.notes}</div>}
            <div className="erp-card p-4 flex justify-between items-center">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-2xl font-black text-green-700">{selected.currency} {selected.total.toLocaleString()}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="secondary" onClick={()=>{setPreview(selected);setSelected(null);}}>👁 Preview PDF</Btn>
              <Btn>Convert to Invoice</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* PDF Preview Modal */}
      {preview && (
        <Modal title="Proforma Invoice Preview" onClose={()=>setPreview(null)} width="max-w-2xl">
          <div className="p-6 bg-white text-gray-900 m-4 rounded-lg text-sm font-sans">
            <div className="flex justify-between mb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900">{COMPANY.short}</h1>
                <p className="text-xs text-gray-500 mt-1">{COMPANY.address}</p>
                <p className="text-xs text-gray-500">NPWP: {COMPANY.npwp}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-blue-700">PROFORMA INVOICE</p>
                <p className="font-mono text-sm mt-1">{preview.pi_no}</p>
                <p className="text-xs text-gray-500">{DATE(preview.date)}</p>
              </div>
            </div>
            <div className="border border-gray-200 rounded p-3 mb-4">
              <p className="text-xs text-gray-500">Bill To:</p>
              <p className="font-bold">{preview.customer?.name}</p>
              <p className="text-xs text-gray-500">{preview.customer?.country}</p>
            </div>
            <table className="w-full text-sm border-collapse mb-4">
              <thead><tr className="bg-gray-100">
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Amount</th>
              </tr></thead>
              <tbody><tr>
                <td className="p-2 border-b">Plywood — as per Sales Order</td>
                <td className="p-2 border-b text-right font-bold">{preview.currency} {preview.total.toLocaleString()}</td>
              </tr></tbody>
            </table>
            <div className="flex justify-between mt-4">
              <div className="text-xs text-gray-500"><p>Payment: {preview.payment_terms}</p><p className="mt-1">{preview.bank_details}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">Total</p><p className="text-2xl font-black">{preview.currency} {preview.total.toLocaleString()}</p></div>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Btn variant="secondary" onClick={()=>setPreview(null)}>Close</Btn>
            <Btn onClick={()=>window.print()}>🖨 Print</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
