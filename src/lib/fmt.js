// Currency, date, number formatters

export const IDR = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v || 0);

export const USD = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(v || 0);

export const NUM = (v, dec = 0) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(v || 0);

export const PCT = (v) => `${(v || 0).toFixed(1)}%`;

export const DATE = (v) => v ? new Date(v).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const SHORT_DATE = (v) => v ? new Date(v).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "—";

export const days_ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10); };
export const days_from_now = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0,10); };
export const TODAY = () => new Date().toISOString().slice(0,10);

export const STATUS_COLORS = {
  // General
  Draft:    "bg-gray-700 text-gray-300",
  Pending:  "bg-amber-500/20 text-amber-400",
  Approved: "bg-blue-500/20 text-blue-400",
  Posted:   "bg-blue-500/20 text-blue-400",
  Sent:     "bg-purple-500/20 text-purple-400",
  Active:   "bg-green-500/20 text-green-400",
  Closed:   "bg-gray-600 text-gray-400",
  Cancelled:"bg-red-500/20 text-red-400",
  // Invoice
  Unpaid:   "bg-red-500/20 text-red-400",
  Partial:  "bg-amber-500/20 text-amber-400",
  Paid:     "bg-green-500/20 text-green-400",
  Overdue:  "bg-red-600/30 text-red-300 font-bold",
  // WO
  "In Progress": "bg-blue-500/20 text-blue-400",
  Completed:     "bg-green-500/20 text-green-400",
  Planned:       "bg-gray-700 text-gray-300",
  Received:      "bg-green-500/20 text-green-400",
  Shipped:       "bg-purple-500/20 text-purple-400",
  Confirmed:     "bg-blue-500/20 text-blue-400",
};

export const badge = (status) => {
  const c = STATUS_COLORS[status] || "bg-gray-700 text-gray-300";
  return `inline-flex items-center text-xs px-2 py-0.5 rounded font-medium ${c}`;
};

export const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
