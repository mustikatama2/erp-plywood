import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, FormField, toast } from "../../components/ui";
import { DATE } from "../../lib/fmt";
import { SHIPMENTS, CUSTOMERS, SALES_ORDERS, COMPANY } from "../../data/seed";
import DocumentTrail from "../../components/DocumentTrail";

const today = new Date().toISOString().split("T")[0];

function genSHPNo(list) {
  if (!list.length) return "SHP-001";
  const nums = list.map(s => parseInt((s.shipment_no || s.shp_no || "SHP-000").split("-").pop()) || 0);
  return `SHP-${String(Math.max(...nums) + 1).padStart(3, "0")}`;
}

function NewShipmentModal({ onClose, onSave, shipments }) {
  const [form, setForm] = useState({
    customer_id: "",
    so_id: "",
    date: today,
    vessel: "",
    bl_no: "",
    port_loading: "Surabaya / Tanjung Perak",
    port_discharge: "",
    container: "",
    gross_weight: "",
    cbm: "",
    catatan: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const customerSOs = form.customer_id
    ? SALES_ORDERS.filter(s => s.customer_id === form.customer_id)
    : [];

  const handleSave = () => {
    if (!form.customer_id) return toast("Pilih customer terlebih dahulu", "error");
    const shp_no = genSHPNo(shipments);
    onSave({
      id: `shp-${Date.now()}`,
      shipment_no: shp_no,
      customer_id: form.customer_id,
      so_id: form.so_id,
      date: form.date,
      vessel: form.vessel,
      bl_no: form.bl_no,
      port_loading: form.port_loading,
      port_discharge: form.port_discharge,
      container: form.container,
      gross_weight: form.gross_weight ? `${form.gross_weight} kg` : "—",
      cbm: Number(form.cbm) || 0,
      catatan: form.catatan,
      status: "Draft",
      docs: [],
    });
    toast(`✅ Shipment ${shp_no} berhasil dicatat`, "success");
    onClose();
  };

  return (
    <Modal title="New Shipment" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="No. Shipment">
            <input className="erp-input w-full bg-gray-50 text-gray-500" readOnly value={genSHPNo(shipments)} />
          </FormField>
          <FormField label="Tanggal" required>
            <input type="date" className="erp-input w-full" value={form.date} onChange={e => set("date", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Customer" required>
          <select className="erp-input w-full" value={form.customer_id} onChange={e => { set("customer_id", e.target.value); set("so_id", ""); }}>
            <option value="">— Pilih Customer —</option>
            {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <FormField label="Sales Order">
          <select className="erp-input w-full" value={form.so_id} onChange={e => set("so_id", e.target.value)} disabled={!form.customer_id}>
            <option value="">— Pilih SO (opsional) —</option>
            {customerSOs.map(so => <option key={so.id} value={so.id}>{so.so_no} · {so.status}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Vessel / Kapal">
            <input type="text" className="erp-input w-full" placeholder="Nama kapal…" value={form.vessel} onChange={e => set("vessel", e.target.value)} />
          </FormField>
          <FormField label="No. B/L">
            <input type="text" className="erp-input w-full" placeholder="Bill of Lading No." value={form.bl_no} onChange={e => set("bl_no", e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Port of Loading">
            <input type="text" className="erp-input w-full" value={form.port_loading} onChange={e => set("port_loading", e.target.value)} />
          </FormField>
          <FormField label="Port of Discharge">
            <input type="text" className="erp-input w-full" placeholder="Pelabuhan tujuan…" value={form.port_discharge} onChange={e => set("port_discharge", e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Container No">
            <input type="text" className="erp-input w-full" placeholder="XXXX1234567" value={form.container} onChange={e => set("container", e.target.value)} />
          </FormField>
          <FormField label="Gross Weight (kg)">
            <input type="number" className="erp-input w-full" placeholder="0" value={form.gross_weight} onChange={e => set("gross_weight", e.target.value)} />
          </FormField>
          <FormField label="CBM (m³)">
            <input type="number" className="erp-input w-full" placeholder="0" value={form.cbm} onChange={e => set("cbm", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Catatan">
          <textarea className="erp-input w-full" rows={2} placeholder="Catatan pengiriman…" value={form.catatan} onChange={e => set("catatan", e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan Shipment</Btn>
        </div>
      </div>
    </Modal>
  );
}

function InvoicePreviewModal({ shipment, customer, onClose }) {
  return (
    <Modal title="Invoice Preview" onClose={onClose} width="max-w-2xl">
      <div className="p-6 bg-white text-gray-900 m-4 rounded-lg text-sm font-sans border border-gray-200">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{COMPANY.short}</h1>
            <p className="text-xs text-gray-500 mt-1">{COMPANY.address}</p>
            <p className="text-xs text-gray-500">NPWP: {COMPANY.npwp}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-blue-700">COMMERCIAL INVOICE</p>
            <p className="font-mono text-sm mt-1">INV-{shipment.shipment_no}</p>
            <p className="text-xs text-gray-500">{DATE(shipment.date)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="border border-gray-200 rounded p-3">
            <p className="text-xs text-gray-500">Bill To:</p>
            <p className="font-bold">{customer?.name || "—"}</p>
            <p className="text-xs text-gray-500">{customer?.country}</p>
          </div>
          <div className="border border-gray-200 rounded p-3">
            <p className="text-xs text-gray-500">Shipment Details:</p>
            <p className="text-xs"><span className="text-gray-500">B/L:</span> {shipment.bl_no || "—"}</p>
            <p className="text-xs"><span className="text-gray-500">Vessel:</span> {shipment.vessel || "—"}</p>
            <p className="text-xs"><span className="text-gray-500">Port:</span> {shipment.port_discharge || "—"}</p>
          </div>
        </div>
        <table className="w-full text-sm border-collapse mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">CBM</th>
              <th className="p-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border-b">Plywood — as per Shipment {shipment.shipment_no}</td>
              <td className="p-2 border-b text-right">{shipment.cbm} m³</td>
              <td className="p-2 border-b text-right font-bold">—</td>
            </tr>
          </tbody>
        </table>
        <div className="text-xs text-gray-500 mt-2">
          <p>Container: {shipment.container || "—"} · GW: {shipment.gross_weight || "—"}</p>
        </div>
      </div>
      <div className="px-5 pb-5 flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
        <Btn onClick={() => window.print()}>🖨 Print</Btn>
      </div>
    </Modal>
  );
}

export default function Shipments() {
  const [search, setSearch]             = useState("");
  const [selected, setSelected]         = useState(null);
  const [showNew, setShowNew]           = useState(false);
  const [showInvoice, setShowInvoice]   = useState(false);
  const [localShipments, setLocalShipments] = useState([]);

  const allShipments = [...localShipments, ...SHIPMENTS];
  const enriched = allShipments.map(s => ({
    ...s, customer: CUSTOMERS.find(c => c.id === s.customer_id),
  }));

  const filtered = enriched.filter(s =>
    s.shipment_no.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.vessel || "").toLowerCase().includes(search.toLowerCase())
  );

  const docStatus = (docs) => {
    if (!docs || docs.length === 0) return <span className="text-gray-400 text-xs">—</span>;
    const pending = docs.filter(d => d.status === "Pending").length;
    return pending > 0
      ? <span className="text-amber-700 text-xs font-bold">{pending} pending</span>
      : <span className="text-green-700 text-xs font-bold">✓ Complete</span>;
  };

  return (
    <div>
      <PageHeader title="Shipments" subtitle={`${allShipments.length} records`}
        actions={<Btn onClick={() => setShowNew(true)}>+ New Shipment</Btn>} />

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search shipment no, vessel…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key: "shipment_no",    label: "Shipment No",   render: v => <span className="font-mono font-bold text-blue-700">{v}</span> },
          { key: "customer",       label: "Customer",      render: v => v?.name.split(" ").slice(0, 3).join(" ") },
          { key: "date",           label: "Date",          render: DATE },
          { key: "vessel",         label: "Vessel" },
          { key: "port_discharge", label: "Destination" },
          { key: "bl_no",          label: "B/L No",        render: v => <span className="font-mono text-xs">{v || "—"}</span> },
          { key: "docs",           label: "Documents",     render: v => docStatus(v) },
          { key: "status",         label: "Status",        render: v => <Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.shipment_no} onClose={() => setSelected(null)} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Customer", selected.customer?.name], ["Date", DATE(selected.date)],
                ["Vessel", selected.vessel], ["B/L No", selected.bl_no],
                ["Port of Loading", selected.port_loading], ["Port of Discharge", selected.port_discharge],
                ["Container", selected.container], ["Gross Weight", selected.gross_weight],
                ["CBM", `${selected.cbm} m³`], ["Status", selected.status]].map(([k, v]) => (
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-900">{v || "—"}</p></div>
              ))}
            </div>

            {selected.docs && selected.docs.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Shipping Documents</p>
                <table className="erp-table">
                  <thead><tr><th>Document Type</th><th>Number</th><th>Status</th></tr></thead>
                  <tbody>
                    {selected.docs.map((d, i) => (
                      <tr key={i}>
                        <td>{d.type}</td>
                        <td><span className="font-mono text-xs">{d.no}</span></td>
                        <td>
                          <span className={`text-xs font-bold ${d.status === "Valid" || d.status === "Received" || d.status === "Done" ? "text-green-700" : "text-amber-700"}`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selected.docs?.find(d => d.type === "SVLK Certificate") && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                ✅ SVLK Certificate valid — Timber Legality Compliance confirmed for this shipment
              </div>
            )}

            <DocumentTrail
              refId={selected.id}
              refType="SHIPMENT"
              blNo={selected.bl_no}
              soId={selected.so_id}
            />

            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setSelected(null)}>Close</Btn>
              <Btn variant="secondary" onClick={() => {
                toast("📋 Packing List dicetak", "success");
              }}>Generate Packing List</Btn>
              <Btn onClick={() => setShowInvoice(true)}>Generate Invoice</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showInvoice && selected && (
        <InvoicePreviewModal
          shipment={selected}
          customer={selected.customer}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {showNew && (
        <NewShipmentModal
          onClose={() => setShowNew(false)}
          onSave={s => setLocalShipments(prev => [s, ...prev])}
          shipments={allShipments}
        />
      )}
    </div>
  );
}
