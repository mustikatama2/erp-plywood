import { useState } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal, FormField, Divider, toast } from "../../components/ui";
import { IDR, DATE, exportCSV } from "../../lib/fmt";
import { AR_INVOICES, CUSTOMERS, SALES_ORDERS, SHIPMENTS } from "../../data/seed";
import { useJournal } from "../../contexts/JournalContext";
import DocumentTrail from "../../components/DocumentTrail";

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
  const [localInvoices, setLocalInvoices] = useState([]);
  const [overrides, setOverrides]     = useState({}); // id → partial overrides

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
    </div>
  );
}
