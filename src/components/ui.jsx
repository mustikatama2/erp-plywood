// Shared UI primitives
import { badge } from "../lib/fmt";

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h2 className="text-lg font-black text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function KPICard({ label, value, sub, color = "text-white", icon, trend }) {
  return (
    <div className="erp-card p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      {trend != null && (
        <p className={`text-xs mt-1 font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}% vs last month
        </p>
      )}
    </div>
  );
}

export function Card({ title, children, action, className = "" }) {
  return (
    <div className={`erp-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-300">{title}</h3>
          {action}
        </div>
      )}
      <div className={title ? "p-5" : "p-5"}>{children}</div>
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "sm", type = "button", disabled = false, className = "" }) {
  const base = "inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-40";
  const sizes = { xs:"text-xs px-2 py-1", sm:"text-sm px-3 py-2", md:"text-sm px-4 py-2.5" };
  const variants = {
    primary:  "bg-blue-600 hover:bg-blue-500 text-white",
    secondary:"bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300",
    danger:   "bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400",
    success:  "bg-green-600/20 hover:bg-green-600/40 border border-green-600/40 text-green-400",
    ghost:    "hover:bg-gray-800 text-gray-400",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ status }) {
  return <span className={badge(status)}>{status}</span>;
}

export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="erp-input pl-9 w-64" />
    </div>
  );
}

export function Table({ columns, data, onRowClick, empty = "No records found" }) {
  if (!data?.length) return (
    <div className="text-center py-16 text-gray-500">
      <p className="text-3xl mb-2">📭</p>
      <p>{empty}</p>
    </div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="erp-table">
        <thead>
          <tr>{columns.map(col => (
            <th key={col.key} className={col.right ? "text-right" : ""}>{col.label}</th>
          ))}</tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} onClick={onRowClick ? () => onRowClick(row) : undefined}
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

export function Modal({ title, children, onClose, width = "max-w-2xl" }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className={`bg-gray-900 border border-gray-700 rounded-2xl w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FormField({ label, children, required }) {
  return (
    <div>
      <label className={`erp-label ${required ? "after:content-['*'] after:text-red-400 after:ml-0.5" : ""}`}>{label}</label>
      {children}
    </div>
  );
}

export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-gray-800" />
      {label && <span className="text-xs text-gray-600 uppercase tracking-widest">{label}</span>}
      <div className="flex-1 border-t border-gray-800" />
    </div>
  );
}

export function EmptyState({ icon = "📭", title, subtitle, action }) {
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-3">{icon}</p>
      <h3 className="text-lg font-bold text-gray-400">{title}</h3>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
