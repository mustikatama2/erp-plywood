import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, FormField, Divider, toast } from "../../components/ui";
import { IDR, DATE } from "../../lib/fmt";
import { PROFORMAS, CUSTOMERS, COMPANY } from "../../data/seed";

const today = new Date().toISOString().split("T")[0];

function genPINo(list) {
  if (!list.length) return "PI-0001";
  const nums = list.map(p => parseInt((p.pi_no || "PI-0000").replace(/[^0-9]/g, "")) || 0);
  return `PI-${String(Math.max(...nums) + 1).padStart(4, "0")}`;
}

const EMPTY_LINE = () => ({ desc: "", qty: "", unit: "Sheet", unit_price: "" });

function NewPIModal({ onClose, onSave, piList }) {
  const [form, setForm] = useState({
    customer_id: "",
    valid_until: "",
    payment_terms: "T/T 30%",
    currency: "USD",
    bank_details: COMPANY.bank_details || "BCA USD Account",
    notes: "",
  });
  const [lines, setLines] = useState([EMPTY_LINE()]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateLine = (i, k, v) => {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  };
  const addLine = () => setLines(ls => [...ls, EMPTY_LINE()]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const total = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unit_price) || 0), 0);

  const handleSave = () => {
    if (!form.customer_id) return toast("Pilih customer terlebih dahulu", "error");
    if (lines.some(l => !l.desc.trim())) return toast("Deskripsi item tidak boleh kosong", "error");
    const pi_no = genPINo(piList);
    onSave({
      id: `pi-${Date.now()}`,
      pi_no,
      customer_id: form.customer_id,
      date: today,
      valid_until: form.valid_until || today,
      payment_terms: form.payment_terms,
      currency: form.currency,
      bank_details: form.bank_details,
      notes: form.notes,
      total,
      lines,
      status: "Draft",
    });
    toast(`✅ PI ${pi_no} berhasil dibuat`, "success");
    onClose();
  };

  return (
    <Modal title="New Proforma Invoice" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="PI Number">
            <input className="erp-input w-full bg-gray-50 text-gray-500" readOnly value={genPINo(piList)} />
          </FormField>
          <FormField label="Valid Until">
            <input type="date" className="erp-input w-full" value={form.valid_until} onChange={e => set("valid_until", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Customer" required>
          <select className="erp-input w-full" value={form.customer_id} onChange={e => set("customer_id", e.target.value)}>
            <option value="">— Pilih Customer —</option>
            {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name} ({c.country})</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Payment Terms">
            <select className="erp-input w-full" value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)}>
              <option>T/T 30%</option>
              <option>T/T Full</option>
              <option>L/C at Sight</option>
              <option>D/P</option>
            </select>
          </FormField>
          <FormField label="Currency">
            <select className="erp-input w-full" value={form.currency} onChange={e => set("currency", e.target.value)}>
              <option>USD</option>
              <option>IDR</option>
            </select>
          </FormField>
        </div>

        <FormField label="Bank Details">
          <textarea className="erp-input w-full" rows={2} value={form.bank_details} onChange={e => set("bank_details", e.target.value)} />
        </FormField>

        <Divider label="Items" />

        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                {i === 0 && <p className="erp-label mb-1">Deskripsi</p>}
                <input type="text" className="erp-input w-full" placeholder="Deskripsi produk…" value={line.desc} onChange={e => updateLine(i, "desc", e.target.value)} />
              </div>
              <div className="col-span-2">
                {i === 0 && <p className="erp-label mb-1">Qty</p>}
                <input type="number" className="erp-input w-full text-right" placeholder="0" value={line.qty} onChange={e => updateLine(i, "qty", e.target.value)} />
              </div>
              <div className="col-span-2">
                {i === 0 && <p className="erp-label mb-1">Unit</p>}
                <select className="erp-input w-full" value={line.unit} onChange={e => updateLine(i, "unit", e.target.value)}>
                  <option>Sheet</option>
                  <option>m³</option>
                  <option>CBM</option>
                  <option>pcs</option>
                </select>
              </div>
              <div className="col-span-2">
                {i === 0 && <p className="erp-label mb-1">Unit Price</p>}
                <input type="number" className="erp-input w-full text-right" placeholder="0" value={line.unit_price} onChange={e => updateLine(i, "unit_price", e.target.value)} />
              </div>
              <div className="col-span-1">
                {i === 0 && <p className="erp-label mb-1">Total</p>}
                <p className="text-sm font-bold text-gray-700 py-2.5 text-right">
                  {(Number(line.qty) * Number(line.unit_price) || 0).toLocaleString()}
                </p>
              </div>
              <div className="col-span-1">
                {i === 0 && <p className="erp-label mb-1">&nbsp;</p>}
                {lines.length > 1 && (
                  <button onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700 text-lg font-bold w-full text-center py-2">×</button>
                )}
              </div>
            </div>
          ))}
          <Btn variant="secondary" size="xs" onClick={addLine}>+ Tambah Item</Btn>
        </div>

        <div className="flex justify-end">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
            <span className="text-gray-500">Total: </span>
            <span className="font-black text-gray-900">{form.currency} {total.toLocaleString()}</span>
          </div>
        </div>

        <FormField label="Notes">
          <textarea className="erp-input w-full" rows={2} placeholder="Catatan tambahan…" value={form.notes} onChange={e => set("notes", e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan PI</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function ProformaInvoices() {
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState(null);
  const [preview, setPreview]     = useState(null);
  const [showNew, setShowNew]     = useState(false);
  const [localPIs, setLocalPIs]   = useState([]);

  const allPIs = [...localPIs, ...PROFORMAS];

  const enriched = allPIs.map(pi => ({
    ...pi, customer: CUSTOMERS.find(c => c.id === pi.customer_id),
  }));

  const filtered = enriched.filter(pi =>
    pi.pi_no.toLowerCase().includes(search.toLowerCase()) ||
    pi.customer?.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConvert = (pi) => {
    const invNo = `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    // Mark as Converted in local state
    setLocalPIs(prev => prev.map(p => p.id === pi.id ? { ...p, status: "Converted" } : p));
    setSelected(null);
    toast(`✅ PI dikonversi ke Invoice AR · ${invNo} dibuat`, "success");
  };

  return (
    <div>
      <PageHeader title="Proforma Invoices" subtitle={`${allPIs.length} total`}
        actions={
          <>
            <Btn variant="secondary">📤 Export</Btn>
            <Btn onClick={() => setShowNew(true)}>+ New PI</Btn>
          </>
        }
      />

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search PI no, customer…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key: "pi_no",        label: "PI Number",    render: v => <span className="font-mono font-bold text-blue-700">{v}</span> },
          { key: "customer",     label: "Customer",     render: v => v?.name },
          { key: "date",         label: "Date",         render: DATE },
          { key: "valid_until",  label: "Valid Until",  render: (v) => {
            const expired = new Date(v) < new Date();
            return <span className={expired ? "text-red-700" : "text-gray-700"}>{DATE(v)}{expired ? " ⚠️" : ""}</span>;
          }},
          { key: "payment_terms", label: "Payment Terms" },
          { key: "currency",     label: "Currency" },
          { key: "total",        label: "Amount",       right: true, render: (v, r) => <span className="font-bold">{r.currency} {v.toLocaleString()}</span> },
          { key: "status",       label: "Status",       render: v => <Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.pi_no} onClose={() => setSelected(null)} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Customer", selected.customer?.name], ["Date", DATE(selected.date)],
                ["Valid Until", DATE(selected.valid_until)], ["Payment Terms", selected.payment_terms],
                ["Bank Details", selected.bank_details], ["Status", selected.status]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v || "—"}</p></div>
              ))}
            </div>
            {selected.notes && <div className="bg-gray-50 rounded p-3 text-sm text-gray-400">{selected.notes}</div>}
            <div className="erp-card p-4 flex justify-between items-center">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-2xl font-black text-green-700">{selected.currency} {selected.total.toLocaleString()}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" onClick={() => setSelected(null)}>Close</Btn>
              <Btn variant="secondary" onClick={() => { setPreview(selected); setSelected(null); }}>👁 Preview PDF</Btn>
              <Btn
                disabled={selected.status === "Converted"}
                onClick={() => handleConvert(selected)}
              >
                {selected.status === "Converted" ? "✅ Sudah Dikonversi" : "Convert to Invoice"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {preview && (
        <Modal title="Proforma Invoice Preview" onClose={() => setPreview(null)} width="max-w-2xl">
          <div className="p-6 bg-white text-gray-900 m-4 rounded-lg text-sm font-sans border border-gray-200">
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
              <div className="text-xs text-gray-500">
                <p>Payment: {preview.payment_terms}</p>
                <p className="mt-1">{preview.bank_details}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-black">{preview.currency} {preview.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-2">
            <Btn variant="secondary" onClick={() => setPreview(null)}>Close</Btn>
            <Btn onClick={() => window.print()}>🖨 Print</Btn>
          </div>
        </Modal>
      )}

      {showNew && (
        <NewPIModal
          onClose={() => setShowNew(false)}
          onSave={pi => setLocalPIs(prev => [pi, ...prev])}
          piList={allPIs}
        />
      )}
    </div>
  );
}
