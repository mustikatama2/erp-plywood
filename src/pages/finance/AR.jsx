import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal, FormField, Divider, toast } from "../../components/ui";
import { IDR, DATE, exportCSV } from "../../lib/fmt";
import { AR_INVOICES, CUSTOMERS, SALES_ORDERS, SHIPMENTS, COMPANY } from "../../data/seed";
import { useJournal } from "../../contexts/JournalContext";
import DocumentTrail from "../../components/DocumentTrail";

// ── Print Invoice Modal ───────────────────────────────────────────────────────
function PrintInvoiceModal({ invoice, onClose }) {
  const customer = invoice.customer || CUSTOMERS.find(c => c.id === invoice.customer_id);
  const shipment = SHIPMENTS.find(s => s.so_id === invoice.so_id);

  const handlePrint = () => {
    document.title = `Invoice ${invoice.inv_no}`;
    window.print();
    document.title = "Mustikatama ERP";
  };

  return (
    <Modal title={`Print Invoice — ${invoice.inv_no}`} onClose={onClose} width="max-w-3xl">
      <div className="p-4">
        <div className="flex justify-end gap-2 mb-4 no-print">
          <Btn variant="secondary" onClick={onClose}>✕ Tutup</Btn>
          <Btn className="print-show" onClick={handlePrint}>🖨️ Print</Btn>
        </div>

        {/* A4 document */}
        <div className="print-doc print-area bg-white border border-gray-200 rounded-lg p-8" id="print-invoice">
          {/* Letterhead */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
            <div>
              <h1 className="text-xl font-black text-gray-900" style={{fontFamily:"Georgia,serif"}}>
                PT. MUSTIKATAMA GRAHA PERSADA
              </h1>
              <p className="text-xs text-gray-600 mt-1">Jl. Industri Raya No. 12, Kawasan Industri, Bekasi 17520</p>
              <p className="text-xs text-gray-600">NPWP: 01.234.567.8-091.000</p>
              <p className="text-xs text-gray-600">Telp: (021) 8840-1234 · Email: export@mustikatama.co.id</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Document Type</div>
              <h2 className="text-2xl font-black text-gray-800 border-2 border-gray-800 px-3 py-1">COMMERCIAL INVOICE</h2>
            </div>
          </div>

          {/* Invoice meta */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1 text-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Bill To</p>
              <p className="font-bold text-gray-900 text-base">{customer?.name || "—"}</p>
              <p className="text-gray-700">{customer?.country || "—"}</p>
              {customer?.contact_person && <p className="text-gray-600">Attn: {customer.contact_person}</p>}
            </div>
            {shipment && (
              <div className="space-y-1 text-sm border-l border-gray-200 pl-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Ship To</p>
                <p className="text-gray-700">Port of Discharge: <strong>{shipment.port_discharge}</strong></p>
                <p className="text-gray-700">B/L No: <strong className="font-mono">{shipment.bl_no}</strong></p>
                {shipment.vessel && <p className="text-gray-700">Vessel: {shipment.vessel}</p>}
              </div>
            )}
          </div>

          {/* Invoice details box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-xs text-gray-500 uppercase">Invoice No.</p><p className="font-mono font-bold text-gray-900">{invoice.inv_no}</p></div>
            <div><p className="text-xs text-gray-500 uppercase">Invoice Date</p><p className="font-medium text-gray-900">{DATE(invoice.date)}</p></div>
            <div><p className="text-xs text-gray-500 uppercase">Due Date</p><p className="font-medium text-gray-900">{DATE(invoice.due_date)}</p></div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-6 border border-gray-300">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wider">No.</th>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wider">Description</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Qty</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Unit</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Unit Price</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lines && invoice.lines.length > 0) ? (
                invoice.lines.map((line, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-900">{line.desc || line.product || "—"}</td>
                    <td className="px-3 py-2 text-right">{Number(line.qty).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{line.unit || "pcs"}</td>
                    <td className="px-3 py-2 text-right font-mono">{invoice.currency} {Number(line.unit_price).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold">{invoice.currency} {(Number(line.qty) * Number(line.unit_price)).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-2 text-gray-600">1</td>
                  <td className="px-3 py-2 text-gray-900">Plywood Export</td>
                  <td className="px-3 py-2 text-right">—</td>
                  <td className="px-3 py-2 text-right text-gray-600">—</td>
                  <td className="px-3 py-2 text-right font-mono">—</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">{invoice.currency} {invoice.total.toLocaleString()}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-300 bg-gray-50">
                <td colSpan={5} className="px-3 py-2 text-right font-medium text-gray-700">Subtotal</td>
                <td className="px-3 py-2 text-right font-mono font-bold">{invoice.currency} {invoice.subtotal?.toLocaleString() ?? invoice.total.toLocaleString()}</td>
              </tr>
              {invoice.tax > 0 && (
                <tr className="border-t border-gray-200">
                  <td colSpan={5} className="px-3 py-2 text-right text-gray-600">PPN / Tax (11%)</td>
                  <td className="px-3 py-2 text-right font-mono">{invoice.currency} {invoice.tax.toLocaleString()}</td>
                </tr>
              )}
              <tr className="border-t-2 border-gray-800 bg-gray-800 text-white">
                <td colSpan={5} className="px-3 py-2 text-right font-black uppercase tracking-wider text-sm">Total</td>
                <td className="px-3 py-2 text-right font-mono font-black text-base">{invoice.currency} {invoice.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* Payment terms & bank details */}
          <div className="grid grid-cols-2 gap-6 mt-6 text-sm border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Payment Terms</p>
              <p className="text-gray-700">T/T Bank Transfer · Net 30 days</p>
              {invoice.notes && <p className="text-gray-500 mt-1 italic">{invoice.notes}</p>}
            </div>
            <div className="border-l border-gray-200 pl-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Bank Details</p>
              <p className="text-gray-700">Bank BCA · Acc No: 123-456-7890</p>
              <p className="text-gray-700">Bank Mandiri · Acc No: 987-654-3210</p>
              <p className="text-gray-600 text-xs mt-1">SWIFT/BIC: CENAIDJA / BMRIIDJA</p>
            </div>
          </div>

          {/* Signature block */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-sm text-center">
            <div>
              <p className="text-xs text-gray-500 mb-8">Dibuat Oleh / Prepared By</p>
              <div className="border-t border-gray-800 pt-2">
                <p className="font-medium text-gray-800">PT. Mustikatama Graha Persada</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-8">Disetujui Oleh / Approved By</p>
              <div className="border-t border-gray-800 pt-2">
                <p className="font-medium text-gray-800">Finance Director</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── AR Aging Analysis ─────────────────────────────────────────────────────────
function AgingBuckets({ invoices, customers }) {
  const today = new Date();

  const aging = useMemo(() => {
    const map = {};
    invoices.filter(i => i.status !== "Paid" && i.balance_idr > 0).forEach(i => {
      const cid = i.customer_id;
      if (!map[cid]) map[cid] = { customer: customers.find(c => c.id === cid), b0: 0, b30: 0, b60: 0, b90: 0 };
      const days = Math.round((today - new Date(i.due_date)) / 86400000);
      if      (days <= 30)  map[cid].b0  += i.balance_idr;
      else if (days <= 60)  map[cid].b30 += i.balance_idr;
      else if (days <= 90)  map[cid].b60 += i.balance_idr;
      else                  map[cid].b90 += i.balance_idr;
    });
    return Object.values(map).map(r => ({
      ...r,
      total: r.b0 + r.b30 + r.b60 + r.b90,
      name: r.customer?.name?.split(" ").slice(0, 3).join(" ") || "—",
    }));
  }, [invoices, customers]);

  const totals = aging.reduce((s, r) => ({
    b0: s.b0 + r.b0, b30: s.b30 + r.b30,
    b60: s.b60 + r.b60, b90: s.b90 + r.b90,
    total: s.total + r.total,
  }), { b0: 0, b30: 0, b60: 0, b90: 0, total: 0 });

  const chartData = aging.map(r => ({
    name: r.name,
    "0-30 hr": Math.round(r.b0 / 1e6),
    "31-60 hr": Math.round(r.b30 / 1e6),
    "61-90 hr": Math.round(r.b60 / 1e6),
    "90+ hr": Math.round(r.b90 / 1e6),
  }));

  return (
    <div className="space-y-5 mt-5">
      {/* Bar chart */}
      <Card title="AR Aging per Customer (Rp Juta)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
            <Bar dataKey="0-30 hr"  stackId="a" fill="#22c55e" radius={[0,0,0,0]} />
            <Bar dataKey="31-60 hr" stackId="a" fill="#f59e0b" />
            <Bar dataKey="61-90 hr" stackId="a" fill="#f97316" />
            <Bar dataKey="90+ hr"   stackId="a" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs justify-center flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-green-500" /> 0–30 hr</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-amber-500" /> 31–60 hr</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-orange-500" /> 61–90 hr</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-red-500" /> 90+ hr</span>
        </div>
      </Card>

      {/* Table */}
      <Card title="Detail Aging per Customer">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-green-700 uppercase tracking-wider">0–30 hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-amber-700 uppercase tracking-wider">31–60 hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-orange-700 uppercase tracking-wider">61–90 hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-red-700 uppercase tracking-wider">90+ hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {aging.map(r => (
                <tr key={r.customer?.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{r.name}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-green-700">{r.b0 > 0 ? IDR(r.b0) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{r.b30 > 0 ? IDR(r.b30) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-orange-700">{r.b60 > 0 ? IDR(r.b60) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-red-700">{r.b90 > 0 ? IDR(r.b90) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-gray-900">{IDR(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-black">
                <td className="py-2.5 px-3 text-gray-700 text-sm uppercase tracking-wider">Total</td>
                <td className="py-2.5 px-3 text-right font-mono text-green-700 text-sm">{IDR(totals.b0)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-amber-700 text-sm">{IDR(totals.b30)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-orange-700 text-sm">{IDR(totals.b60)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-red-700 text-sm">{IDR(totals.b90)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-900 text-sm">{IDR(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];
const FX = 15560;

function genInvNo(list) {
  if (!list.length) return "INV-0001";
  const nums = list.map(i => parseInt((i.inv_no || "INV-0000").replace(/[^0-9]/g, "")) || 0);
  return `INV-${String(Math.max(...nums) + 1).padStart(4, "0")}`;
}

const EMPTY_LINE = () => ({ desc: "", qty: "", unit_price: "" });

function NewInvoiceModal({ onClose, onSave, invoices }) {
  const [form, setForm] = useState({
    customer_id: "",
    date: today,
    due_date: "",
    currency: "USD",
    so_id: "",
    notes: "",
  });
  const [lines, setLines] = useState([EMPTY_LINE()]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const customerSOs = form.customer_id
    ? SALES_ORDERS.filter(s => s.customer_id === form.customer_id)
    : [];

  const updateLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine    = () => setLines(ls => [...ls, EMPTY_LINE()]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));

  const total = lines.reduce((s, l) => s + (Number(l.qty) * Number(l.unit_price) || 0), 0);

  const handleSave = () => {
    if (!form.customer_id) return toast("Pilih customer terlebih dahulu", "error");
    if (!form.date) return toast("Tanggal invoice wajib diisi", "error");
    if (lines.some(l => !l.desc.trim())) return toast("Deskripsi item tidak boleh kosong", "error");
    const inv_no = genInvNo(invoices);
    onSave({
      id: `inv-${Date.now()}`,
      inv_no,
      customer_id: form.customer_id,
      date: form.date,
      due_date: form.due_date || form.date,
      currency: form.currency,
      so_id: form.so_id || null,
      notes: form.notes,
      subtotal: total,
      tax: 0,
      total,
      total_idr: total * (form.currency === "USD" ? FX : 1),
      paid: 0,
      balance: total,
      status: "Unpaid",
      lines,
    });
    toast(`✅ Invoice ${inv_no} berhasil dibuat`, "success");
    onClose();
  };

  return (
    <Modal title="New Invoice" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Invoice No">
            <input className="erp-input w-full bg-gray-50 text-gray-500 font-mono" readOnly value={genInvNo(invoices)} />
          </FormField>
          <FormField label="Currency">
            <select className="erp-input w-full" value={form.currency} onChange={e => set("currency", e.target.value)}>
              <option>USD</option>
              <option>IDR</option>
            </select>
          </FormField>
        </div>

        <FormField label="Customer" required>
          <select className="erp-input w-full" value={form.customer_id} onChange={e => { set("customer_id", e.target.value); set("so_id", ""); }}>
            <option value="">— Pilih Customer —</option>
            {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal Invoice" required>
            <input type="date" className="erp-input w-full" value={form.date} onChange={e => set("date", e.target.value)} />
          </FormField>
          <FormField label="Jatuh Tempo / Due Date">
            <input type="date" className="erp-input w-full" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Sales Order Ref">
          <select className="erp-input w-full" value={form.so_id} onChange={e => set("so_id", e.target.value)} disabled={!form.customer_id}>
            <option value="">— Opsional —</option>
            {customerSOs.map(so => <option key={so.id} value={so.id}>{so.so_no} · {so.status}</option>)}
          </select>
        </FormField>

        <Divider label="Items" />

        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                {i === 0 && <p className="erp-label mb-1">Deskripsi</p>}
                <input type="text" className="erp-input w-full" placeholder="Deskripsi…" value={line.desc} onChange={e => updateLine(i, "desc", e.target.value)} />
              </div>
              <div className="col-span-2">
                {i === 0 && <p className="erp-label mb-1">Qty</p>}
                <input type="number" className="erp-input w-full text-right" placeholder="0" value={line.qty} onChange={e => updateLine(i, "qty", e.target.value)} />
              </div>
              <div className="col-span-3">
                {i === 0 && <p className="erp-label mb-1">Unit Price ({form.currency})</p>}
                <input type="number" className="erp-input w-full text-right" placeholder="0" value={line.unit_price} onChange={e => updateLine(i, "unit_price", e.target.value)} />
              </div>
              <div className="col-span-1">
                {i === 0 && <p className="erp-label mb-1">Total</p>}
                <p className="text-sm font-bold text-gray-700 py-2.5 text-right text-xs">
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
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <span className="text-gray-500 text-sm">Total: </span>
            <span className="font-black text-gray-900">{form.currency} {total.toLocaleString()}</span>
          </div>
        </div>

        <FormField label="Notes">
          <textarea className="erp-input w-full" rows={2} placeholder="Catatan…" value={form.notes} onChange={e => set("notes", e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan Invoice</Btn>
        </div>
      </div>
    </Modal>
  );
}

function RecordPaymentModal({ invoice, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: invoice.balance,
    date: today,
    method: "T/T Bank Transfer",
    ref: "",
    catatan: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.amount || Number(form.amount) <= 0) return toast("Jumlah bayar wajib diisi", "error");
    const paid = Number(form.amount);
    const newBalance = Math.max(0, invoice.balance - paid);
    const newStatus = newBalance === 0 ? "Paid" : "Partial";
    onSave(invoice.id, { paid: invoice.paid + paid, balance: newBalance, status: newStatus }, paid, form.method);
    toast(`✅ Pembayaran ${invoice.currency} ${paid.toLocaleString()} dicatat untuk ${invoice.inv_no}`, "success");
    onClose();
  };

  return (
    <Modal title="Catat Pembayaran" onClose={onClose} width="max-w-md">
      <div className="p-5 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-500 mb-1">Invoice</p>
          <p className="font-bold font-mono text-amber-700">{invoice.inv_no}</p>
          <p className="text-gray-700 text-xs mt-0.5">{invoice.customer?.name || "—"}</p>
          <div className="flex justify-between mt-2">
            <span className="text-gray-500">Outstanding Balance</span>
            <span className="font-black">{invoice.currency} {invoice.balance.toLocaleString()}</span>
          </div>
        </div>

        <FormField label="Jumlah Bayar" required>
          <input type="number" className="erp-input w-full" min="0" max={invoice.balance} value={form.amount} onChange={e => set("amount", e.target.value)} />
        </FormField>

        <FormField label="Tanggal Bayar" required>
          <input type="date" className="erp-input w-full" value={form.date} onChange={e => set("date", e.target.value)} />
        </FormField>

        <FormField label="Metode Pembayaran">
          <select className="erp-input w-full" value={form.method} onChange={e => set("method", e.target.value)}>
            <option>T/T Bank Transfer</option>
            <option>L/C</option>
            <option>Cek</option>
            <option>Tunai</option>
          </select>
        </FormField>

        <FormField label="Referensi Bank">
          <input type="text" className="erp-input w-full" placeholder="No. referensi transfer…" value={form.ref} onChange={e => set("ref", e.target.value)} />
        </FormField>

        <FormField label="Catatan">
          <textarea className="erp-input w-full" rows={2} placeholder="Catatan tambahan…" value={form.catatan} onChange={e => set("catatan", e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn variant="solid_green" onClick={handleSave}>✅ Catat Pembayaran</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function AR() {
  const journal = useJournal();

  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("All");
  const [selected, setSelected]       = useState(null);
  const [showNew, setShowNew]         = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showPrint, setShowPrint]     = useState(false);
  const [localInvoices, setLocalInvoices] = useState([]);
  const [overrides, setOverrides]     = useState({}); // id → partial overrides
  const [showAging, setShowAging]     = useState(false);

  const allInvoices = [...localInvoices, ...AR_INVOICES];

  const enriched = allInvoices.map(i => ({
    ...i,
    ...(overrides[i.id] || {}),
    customer: CUSTOMERS.find(c => c.id === i.customer_id),
    balance_idr: (overrides[i.id]?.balance ?? i.balance) * (i.currency === "USD" ? FX : 1),
  }));

  const STATUSES = ["All", "Unpaid", "Partial", "Overdue", "Paid"];
  const filtered = enriched
    .filter(i => filter === "All" || i.status === filter)
    .filter(i => i.inv_no.toLowerCase().includes(search.toLowerCase()) ||
                 i.customer?.name.toLowerCase().includes(search.toLowerCase()));

  const total   = enriched.reduce((s, i) => s + i.balance_idr, 0);
  const overdue = enriched.filter(i => i.status === "Overdue").reduce((s, i) => s + i.balance_idr, 0);

  const handlePaymentSave = (id, changes, paymentAmount, paymentMethod) => {
    setOverrides(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...changes } }));
    // Post journal entry for payment
    const inv = enriched.find(i => i.id === id);
    if (inv && paymentAmount > 0) {
      const amtIDR = paymentAmount * (inv.currency === "USD" ? FX : 1);
      journal.postARPayment(inv, amtIDR, paymentMethod);
    }
    setSelected(null);
  };

  // Get the enriched version of selected
  const selectedEnriched = selected ? enriched.find(i => i.id === selected.id) || selected : null;

  return (
    <div>
      <PageHeader title="Piutang Dagang (AR)" subtitle="Invoice customer & status pembayaran"
        actions={
          <>
            <Btn variant="secondary" onClick={() => setShowAging(a => !a)}>
              {showAging ? "📋 Hide Aging" : "📊 Aging Analysis"}
            </Btn>
            <Btn variant="secondary" onClick={() => exportCSV(enriched.map(i => ({ ...i, customer: i.customer?.name })), "ar.csv")}>📤 Export</Btn>
            <Btn onClick={() => setShowNew(true)}>+ New Invoice</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Piutang" sublabel="AR Outstanding" value={IDR(total)} color="text-amber-700" icon="📤" />
        <KPICard label="Sudah Jatuh Tempo" sublabel="Overdue" value={IDR(overdue)} color="text-red-700" icon="🔴" sub={`${enriched.filter(i => i.status === "Overdue").length} invoice`} />
        <KPICard label="Invoice Terbuka" sublabel="Open Invoices" value={enriched.filter(i => i.status !== "Paid").length} icon="📄" />
        <KPICard label="Jumlah Customer" sublabel="with balance" value={new Set(enriched.filter(i => i.balance > 0).map(i => i.customer_id)).size} icon="👥" />
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoice, customer…" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                {s}
                <span className="ml-1.5 text-xs opacity-70">{s === "All" ? enriched.length : enriched.filter(i => i.status === s).length}</span>
              </button>
            ))}
          </div>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key: "inv_no",   label: "Invoice No",  render: v => <span className="font-mono font-bold text-blue-700">{v}</span> },
          { key: "customer", label: "Customer",    render: v => v?.name.split(" ").slice(0, 3).join(" ") },
          { key: "date",     label: "Date",        render: DATE },
          { key: "due_date", label: "Due Date",    render: (v, r) => {
            const isOverdue = new Date(v) < new Date() && r.status !== "Paid";
            return <span className={isOverdue ? "text-red-700 font-bold" : "text-gray-700"}>{DATE(v)}{isOverdue ? " ⚠️" : ""}</span>;
          }},
          { key: "currency", label: "Ccy" },
          { key: "total",    label: "Invoice Total", right: true, render: (v, r) => <span className="font-mono">{r.currency} {v.toLocaleString()}</span> },
          { key: "balance",  label: "Balance",       right: true, render: (v, r) => <span className={v > 0 ? "font-black text-amber-700" : "text-gray-500"}>{r.currency} {v.toLocaleString()}</span> },
          { key: "status",   label: "Status",        render: v => <Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {showAging && (
        <AgingBuckets invoices={enriched} customers={CUSTOMERS} />
      )}

      {selected && selectedEnriched && (
        <Modal title={`Invoice ${selectedEnriched.inv_no}`} onClose={() => setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Customer", selectedEnriched.customer?.name], ["Invoice Date", DATE(selectedEnriched.date)],
                ["Due Date", DATE(selectedEnriched.due_date)], ["Currency", selectedEnriched.currency],
                ["Invoice Total", `${selectedEnriched.currency} ${selectedEnriched.total.toLocaleString()}`],
                ["Amount Paid", `${selectedEnriched.currency} ${(selectedEnriched.paid || 0).toLocaleString()}`]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-900">{v}</p></div>
              ))}
            </div>
            <div className="erp-card p-4 flex justify-between items-center">
              <span>Balance Outstanding</span>
              <span className={`text-2xl font-black ${selectedEnriched.balance > 0 ? "text-amber-700" : "text-green-700"}`}>
                {selectedEnriched.currency} {selectedEnriched.balance.toLocaleString()}
              </span>
            </div>
            {/* Document Trail */}
            {(() => {
              const shipment = SHIPMENTS.find(s => s.so_id === selectedEnriched.so_id);
              return (
                <DocumentTrail
                  refId={selectedEnriched.id}
                  refType="AR"
                  blNo={shipment?.bl_no || null}
                  soId={selectedEnriched.so_id}
                />
              );
            })()}
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setSelected(null)}>Close</Btn>
              <Btn variant="secondary" onClick={() => setShowPrint(true)}>🖨️ Print Invoice</Btn>
              {selectedEnriched.balance > 0 && (
                <Btn variant="success" onClick={() => setShowPayment(true)}>💰 Catat Pembayaran</Btn>
              )}
              <Btn variant="secondary" onClick={() => toast("Pengingat terkirim 📧", "success")}>📧 Kirim Reminder</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showPayment && selectedEnriched && (
        <RecordPaymentModal
          invoice={selectedEnriched}
          onClose={() => setShowPayment(false)}
          onSave={handlePaymentSave}
        />
      )}

      {showNew && (
        <NewInvoiceModal
          onClose={() => setShowNew(false)}
          onSave={inv => {
            setLocalInvoices(prev => [inv, ...prev]);
            const customer = CUSTOMERS.find(c => c.id === inv.customer_id);
            const shipment = SHIPMENTS.find(s => s.so_id === inv.so_id);
            journal.postAR(inv, customer, shipment?.bl_no || null, inv.so_id || null);
          }}
          invoices={allInvoices}
        />
      )}

      {showPrint && selectedEnriched && (
        <PrintInvoiceModal
          invoice={selectedEnriched}
          onClose={() => setShowPrint(false)}
        />
      )}
    </div>
  );
}
