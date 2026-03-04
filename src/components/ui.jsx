// Shared UI primitives — warm light-mode, mixed-literacy users
import { useState, useEffect } from "react";
import { badge } from "../lib/fmt";

// ── Toast notification ────────────────────────────────────────────────────────
let _toastFn = null;
export const toast = (msg, type = "success") => _toastFn?.(msg, type);

export function ToastProvider() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _toastFn = (msg, type) => {
      const id = Date.now();
      setToasts(t => [...t, { id, msg, type }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    };
    return () => { _toastFn = null; };
  }, []);
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold animate-in slide-in-from-right-2 ${
          t.type==="success" ? "bg-green-600 text-white" :
          t.type==="error"   ? "bg-red-600 text-white" :
          "bg-gray-800 text-white"
        }`}>
          {t.type==="success" ? "✅" : t.type==="error" ? "❌" : "ℹ️"} {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Page Header ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
export function KPICard({ label, sublabel, value, sub, color = "text-gray-900", icon, trend, accent }) {
  return (
    <div className={`erp-card p-4 ${accent || ""}`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
        </div>
        {icon && <span className="text-2xl leading-none">{icon}</span>}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {trend != null && (
        <p className={`text-xs mt-1 font-semibold ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs bulan lalu
        </p>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ title, subtitle, children, action, className = "" }) {
  return (
    <div className={`erp-card ${className}`}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "sm", type = "button", disabled = false, className = "", title }) {
  const base = "inline-flex items-center gap-1.5 font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-40 whitespace-nowrap";
  const sizes = { xs:"text-xs px-2.5 py-1.5", sm:"text-sm px-4 py-2.5", md:"text-base px-5 py-3" };
  const variants = {
    primary:     "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    secondary:   "bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 shadow-sm",
    danger:      "bg-red-50 hover:bg-red-100 border border-red-200 text-red-700",
    success:     "bg-green-50 hover:bg-green-100 border border-green-200 text-green-700",
    ghost:       "hover:bg-gray-100 text-gray-500",
    gold:        "bg-brand-gold hover:bg-brand-gold-dark text-brand-dark shadow-sm font-bold",
    solid_green: "bg-green-600 hover:bg-green-700 text-white shadow-sm",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
const BI_STATUS = {
  Draft:         "Draf",
  Pending:       "Menunggu",
  Approved:      "Disetujui",
  Posted:        "Terposting",
  Sent:          "Terkirim",
  Active:        "Aktif",
  Closed:        "Selesai",
  Cancelled:     "Dibatalkan",
  Unpaid:        "Belum Bayar",
  Partial:       "Bayar Sebagian",
  Paid:          "Lunas",
  Overdue:       "Jatuh Tempo",
  "In Progress": "Proses",
  Completed:     "Selesai",
  Planned:       "Direncanakan",
  Received:      "Diterima",
  Shipped:       "Dikirim",
  Confirmed:     "Dikonfirmasi",
};

export function Badge({ status, showBI = true }) {
  const bi = BI_STATUS[status];
  return (
    <span className={badge(status)}>
      {status}{showBI && bi && bi !== status ? ` · ${bi}` : ""}
    </span>
  );
}

// ── Search Bar ────────────────────────────────────────────────────────────────
export function SearchBar({ value, onChange, placeholder = "Cari…" }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="erp-input pl-9 w-full md:w-72" />
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
export function Tip({ children, tip }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1" onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      <span className="cursor-help text-gray-400 text-xs">ⓘ</span>
      {show && (
        <span className="absolute bottom-full left-0 mb-1 z-50 bg-white border border-gray-200 text-xs text-gray-700 rounded-xl px-3 py-2 w-56 shadow-lg">
          {tip}
        </span>
      )}
    </span>
  );
}

// ── Data Table ────────────────────────────────────────────────────────────────
export function Table({ columns, data, onRowClick, empty = "Tidak ada data" }) {
  if (!data?.length) return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-3xl mb-2">📭</p>
      <p>{empty}</p>
    </div>
  );
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="erp-table min-w-full">
        <thead>
          <tr>{columns.map(col => (
            <th key={col.key} className={col.right ? "text-right" : ""}>
              <span className="block">{col.label}</span>
              {col.sublabel && <span className="block text-xs text-gray-400 font-normal normal-case tracking-normal">{col.sublabel}</span>}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer" : ""}>
              {columns.map(col => (
                <td key={col.key} className={col.right ? "text-right" : ""}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, children, onClose, width = "max-w-2xl" }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-[1px] z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className={`bg-white border border-gray-200 rounded-t-2xl md:rounded-2xl w-full ${width} max-h-[92vh] overflow-y-auto shadow-modal`}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-2xl leading-none ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Form field ────────────────────────────────────────────────────────────────
export function FormField({ label, sublabel, children, required, tip }) {
  return (
    <div>
      <label className={`erp-label flex items-center gap-1 ${required ? "after:content-['*'] after:text-red-500 after:ml-0.5" : ""}`}>
        {label}
        {tip && <Tip tip={tip}><span /></Tip>}
      </label>
      {sublabel && <p className="text-xs text-gray-400 mb-1">{sublabel}</p>}
      {children}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-gray-200" />
      {label && <span className="text-xs text-gray-400 uppercase tracking-widest">{label}</span>}
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle, action, steps }) {
  return (
    <div className="text-center py-16">
      <p className="text-5xl mb-3">{icon}</p>
      <h3 className="text-lg font-bold text-gray-700">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {steps && (
        <div className="mt-4 text-left max-w-xs mx-auto space-y-2">
          {steps.map((s,i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-500">
              <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────────────
export function QuickActions({ actions }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {actions.map(a => (
        <button key={a.label} onClick={a.onClick}
          className="erp-card p-4 text-left hover:shadow-card-hover hover:border-blue-200 transition-all active:scale-95 group">
          <p className="text-2xl mb-2">{a.icon}</p>
          <p className="text-sm font-bold text-gray-800 group-hover:text-blue-700">{a.label}</p>
          {a.sublabel && <p className="text-xs text-gray-400 mt-0.5">{a.sublabel}</p>}
        </button>
      ))}
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────────────
export function StatRow({ label, value, sublabel, color = "text-gray-900", border = true }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${border ? "border-b border-gray-100" : ""}`}>
      <span className="text-sm text-gray-500">{label}{sublabel && <span className="ml-1 text-xs text-gray-400">({sublabel})</span>}</span>
      <span className={`font-bold text-sm ${color}`}>{value}</span>
    </div>
  );
}
