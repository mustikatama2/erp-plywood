import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { DATE, badge } from "../../lib/fmt";
import { SHIPMENTS, CUSTOMERS } from "../../data/seed";

export default function Shipments() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const enriched = SHIPMENTS.map(s => ({
    ...s, customer: CUSTOMERS.find(c => c.id === s.customer_id),
  }));

  const filtered = enriched.filter(s =>
    s.shipment_no.toLowerCase().includes(search.toLowerCase()) ||
    s.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.vessel || "").toLowerCase().includes(search.toLowerCase())
  );

  const docStatus = (docs) => {
    const pending = docs.filter(d => d.status === "Pending").length;
    return pending > 0
      ? <span className="text-amber-400 text-xs font-bold">{pending} pending</span>
      : <span className="text-green-400 text-xs font-bold">✓ Complete</span>;
  };

  return (
    <div>
      <PageHeader title="Shipments" subtitle={`${SHIPMENTS.length} records`}
        actions={<Btn>+ New Shipment</Btn>} />
      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search shipment no, vessel…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"shipment_no", label:"Shipment No",   render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"customer",    label:"Customer",      render:v=>v?.name.split(" ").slice(0,3).join(" ") },
          { key:"date",        label:"Date",          render:DATE },
          { key:"vessel",      label:"Vessel"         },
          { key:"port_discharge",label:"Destination" },
          { key:"bl_no",       label:"B/L No",        render:v=><span className="font-mono text-xs">{v}</span> },
          { key:"docs",        label:"Documents",     render:v=>docStatus(v) },
          { key:"status",      label:"Status",        render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.shipment_no} onClose={()=>setSelected(null)} width="max-w-2xl">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Customer",selected.customer?.name],["Date",DATE(selected.date)],
                ["Vessel",selected.vessel],["B/L No",selected.bl_no],
                ["Port of Loading",selected.port_loading],["Port of Discharge",selected.port_discharge],
                ["Container",selected.container],["Gross Weight",selected.gross_weight],
                ["CBM",`${selected.cbm} m³`],["Status",selected.status]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v||"—"}</p></div>
              ))}
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Shipping Documents</p>
              <table className="erp-table">
                <thead><tr><th>Document Type</th><th>Number</th><th>Status</th></tr></thead>
                <tbody>
                  {selected.docs.map((d,i) => (
                    <tr key={i}>
                      <td>{d.type}</td>
                      <td><span className="font-mono text-xs">{d.no}</span></td>
                      <td>
                        <span className={`text-xs font-bold ${
                          d.status==="Valid"||d.status==="Received"||d.status==="Done" ? "text-green-400" : "text-amber-400"
                        }`}>{d.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SVLK alert */}
            {selected.docs.find(d=>d.type==="SVLK Certificate") && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs text-green-300">
                ✅ SVLK Certificate valid — Timber Legality Compliance confirmed for this shipment
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="secondary">Generate Packing List</Btn>
              <Btn>Generate Invoice</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
