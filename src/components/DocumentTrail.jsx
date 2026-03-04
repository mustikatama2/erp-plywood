import { useMemo } from "react";
import { useJournal } from "../contexts/JournalContext";
import { SHIPMENTS, SALES_ORDERS, AR_INVOICES } from "../data/seed";

/**
 * DocumentTrail — shows the chain of documents linked to a transaction.
 * Props: { refId, refType, blNo, soId }
 *
 * Renders as a compact timeline:
 * [B/L: MSCU7891234] → [SO-2026-0142] → [INV-2026-0201] → [JE-2026-0889 Posted] → [Payment JE-2026-0891]
 */

const NODE_STYLES = {
  BL:         "bg-teal-500/10 border-teal-500/40 text-teal-700",
  SO:         "bg-purple-500/10 border-purple-500/40 text-purple-700",
  SHIPMENT:   "bg-cyan-500/10 border-cyan-500/40 text-cyan-700",
  INVOICE:    "bg-blue-500/10 border-blue-500/40 text-blue-700",
  JE:         "bg-green-500/10 border-green-500/40 text-green-700",
  PAYMENT:    "bg-emerald-500/10 border-emerald-500/40 text-emerald-700",
  PAYROLL:    "bg-violet-500/10 border-violet-500/40 text-violet-700",
  AP:         "bg-amber-500/10 border-amber-500/40 text-amber-700",
  MANUAL:     "bg-gray-200/50 border-gray-400/40 text-gray-500",
};

function TrailNode({ label, sublabel, type = "JE" }) {
  return (
    <div className={`flex flex-col items-center border rounded-lg px-2.5 py-1.5 text-xs font-medium min-w-max ${NODE_STYLES[type] || NODE_STYLES.MANUAL}`}>
      <span className="font-bold">{label}</span>
      {sublabel && <span className="text-xs opacity-70 font-normal">{sublabel}</span>}
    </div>
  );
}

function Arrow() {
  return <span className="text-gray-400 font-bold flex-shrink-0">→</span>;
}

export default function DocumentTrail({ refId, refType, blNo, soId }) {
  const { getEntriesForDoc } = useJournal();

  const nodes = useMemo(() => {
    const result = [];

    // ── B/L node ──────────────────────────────────────────────────────────
    if (blNo && blNo !== "—") {
      result.push({ type: "BL", label: `B/L: ${blNo}` });
    }

    // ── SO node ───────────────────────────────────────────────────────────
    if (soId) {
      const so = SALES_ORDERS.find(s => s.id === soId);
      if (so) result.push({ type: "SO", label: so.so_no, sublabel: so.status });
    }

    // ── Shipment node (if looking from AR / SO) ───────────────────────────
    if (soId || blNo) {
      const ship = SHIPMENTS.find(s =>
        (soId && s.so_id === soId) ||
        (blNo && blNo !== "—" && s.bl_no === blNo)
      );
      if (ship) {
        result.push({
          type: "SHIPMENT",
          label: ship.shipment_no,
          sublabel: ship.status,
        });
      }
    }

    // ── Invoice node (if refType is AR or linking from shipment) ──────────
    if (refType === "AR" && refId) {
      const inv = AR_INVOICES.find(i => i.id === refId);
      if (inv) result.push({ type: "INVOICE", label: inv.inv_no, sublabel: inv.status });
    }

    // ── Journal Entry nodes ───────────────────────────────────────────────
    const journalEntries = getEntriesForDoc({ refId, blNo, soId });
    for (const je of journalEntries) {
      const isPayment = je.ref_type === "PAYMENT_IN" || je.ref_type === "PAYMENT_OUT";
      const isAP      = je.ref_type === "AP";
      result.push({
        type:     isPayment ? "PAYMENT" : isAP ? "AP" : "JE",
        label:    je.id,
        sublabel: isPayment ? "Payment" : isAP ? "Payable" : "Posted",
      });
    }

    return result;
  }, [refId, refType, blNo, soId, getEntriesForDoc]);

  if (nodes.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Document Trail</p>
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-xl overflow-x-auto">
        {nodes.map((node, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <Arrow />}
            <TrailNode label={node.label} sublabel={node.sublabel} type={node.type} />
          </span>
        ))}
        {nodes.length === 0 && (
          <span className="text-xs text-gray-400">No linked documents found</span>
        )}
      </div>
    </div>
  );
}
