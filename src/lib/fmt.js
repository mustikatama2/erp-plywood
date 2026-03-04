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
  Draft:    "bg-gray-100 text-gray-600",
  Pending:  "bg-amber-50 text-amber-700 border border-amber-200",
  Approved: "bg-blue-50 text-blue-700 border border-blue-200",
  Posted:   "bg-blue-50 text-blue-700 border border-blue-200",
  Sent:     "bg-purple-50 text-purple-700 border border-purple-200",
  Active:   "bg-green-50 text-green-700 border border-green-200",
  Closed:   "bg-gray-100 text-gray-500",
  Cancelled:"bg-red-50 text-red-700 border border-red-200",
  // Invoice
  Unpaid:   "bg-red-50 text-red-700 border border-red-200",
  Partial:  "bg-amber-50 text-amber-700 border border-amber-200",
  Paid:     "bg-green-50 text-green-700 border border-green-200",
  Overdue:  "bg-red-100 text-red-800 border border-red-300 font-bold",
  // WO
  "In Progress": "bg-blue-50 text-blue-700 border border-blue-200",
  Completed:     "bg-green-50 text-green-700 border border-green-200",
  Planned:       "bg-gray-100 text-gray-600",
  Received:      "bg-green-50 text-green-700 border border-green-200",
  Shipped:       "bg-purple-50 text-purple-700 border border-purple-200",
  Confirmed:     "bg-blue-50 text-blue-700 border border-blue-200",
};

export const badge = (status) => {
  const c = STATUS_COLORS[status] || "bg-gray-100 text-gray-600";
  return `inline-flex items-center text-xs px-2 py-0.5 rounded font-medium ${c}`;
};

export const exportCSV = (rows, filename) => {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
};
