import { useState, useMemo, useRef, useEffect } from "react";
import { AR_INVOICES, AP_INVOICES, PRODUCTS, EMPLOYEES, SHIPMENTS } from "../data/seed";
import { useMDM } from "../contexts/MDMContext";
import { useJournal } from "../contexts/JournalContext";

const today = new Date();

function daysDiff(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.round((today - d) / 86400000);
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Math.round((d - today) / 86400000);
}

function buildNotifications(pendingCount, journalEntries) {
  const notes = [];

  // 1. Overdue AR invoices
  AR_INVOICES.filter(i => i.status === "Overdue").forEach(i => {
    const days = daysDiff(i.due_date);
    notes.push({
      id: `ar-${i.id}`,
      icon: "⚠️",
      message: `${i.inv_no} jatuh tempo ${days > 0 ? days + " hari lalu" : "hari ini"}`,
      detail: "Piutang Customer — segera tagih",
      priority: "red",
      ts: i.due_date,
    });
  });

  // 2. Overdue AP invoices
  AP_INVOICES.filter(i => i.status === "Overdue").forEach(i => {
    const days = daysDiff(i.due_date);
    notes.push({
      id: `ap-${i.id}`,
      icon: "⚠️",
      message: `${i.inv_no} hutang vendor jatuh tempo ${days > 0 ? days + " hari lalu" : "hari ini"}`,
      detail: "Hutang Dagang — segera bayar",
      priority: "red",
      ts: i.due_date,
    });
  });

  // 3. Low stock products
  PRODUCTS.filter(p => p.stock_qty != null && p.reorder != null && p.stock_qty < p.reorder).forEach(p => {
    notes.push({
      id: `stk-${p.id}`,
      icon: "📦",
      message: `${p.name} stok menipis (${p.stock_qty} ${p.unit} tersisa)`,
      detail: `Reorder point: ${p.reorder} ${p.unit}`,
      priority: "amber",
      ts: null,
    });
  });

  // 4. Payroll reminder (on day 20-31 of month)
  const dayOfMonth = today.getDate();
  if (dayOfMonth >= 20) {
    const totalPayroll = EMPLOYEES.reduce((s, e) => s + (e.salary || 0), 0);
    notes.push({
      id: "payroll",
      icon: "💵",
      message: `Payroll bulan ini belum diproses`,
      detail: `Total ${EMPLOYEES.filter(e => e.salary > 0).length} karyawan · Rp ${(totalPayroll / 1e6).toFixed(1)}jt`,
      priority: "amber",
      ts: null,
    });
  }

  // 5. MDM pending
  if (pendingCount > 0) {
    notes.push({
      id: "mdm",
      icon: "🗂️",
      message: `${pendingCount} data induk menunggu persetujuan`,
      detail: "Buka MDM Queue untuk review",
      priority: "blue",
      ts: null,
    });
  }

  // 6. Shipments with arrival < 7 days
  SHIPMENTS.filter(s => {
    if (s.status !== "Planned") return false;
    const d = daysUntil(s.date);
    return d !== null && d >= 0 && d < 7;
  }).forEach(s => {
    const d = daysUntil(s.date);
    notes.push({
      id: `shp-${s.id}`,
      icon: "🚢",
      message: `${s.shipment_no} ETA dalam ${d} hari`,
      detail: `${s.vessel || "TBD"} → ${s.port_discharge}`,
      priority: d < 2 ? "red" : "amber",
      ts: s.date,
    });
  });

  // 7. Journal entries today
  const todayStr = today.toISOString().split("T")[0];
  const todayEntries = (journalEntries || []).filter(e => (e.date || "").startsWith(todayStr));
  if (todayEntries.length > 0) {
    notes.push({
      id: "journal",
      icon: "📒",
      message: `${todayEntries.length} jurnal entry diposting hari ini`,
      detail: "Lihat di Ledger untuk detailnya",
      priority: "blue",
      ts: todayStr,
    });
  }

  return notes;
}

const PRIORITY_STYLE = {
  red:   { border: "border-l-red-500",   bg: "bg-red-50",   text: "text-red-700" },
  amber: { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  blue:  { border: "border-l-blue-500",  bg: "bg-blue-50",  text: "text-blue-700" },
};

function timeAgo(ts) {
  if (!ts) return "Baru";
  const d = daysDiff(ts);
  if (d == null) return "";
  if (d === 0) return "Hari ini";
  if (d === 1) return "Kemarin";
  return `${d} hari lalu`;
}

export default function NotificationCenter() {
  const { pendingCount } = useMDM();
  const journal = useJournal();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(new Set());
  const ref = useRef(null);

  const journalEntries = useMemo(() => {
    try { return journal.entries || []; } catch { return []; }
  }, [journal]);

  const notifications = useMemo(
    () => buildNotifications(pendingCount, journalEntries),
    [pendingCount, journalEntries]
  );

  const unreadCount = notifications.filter(n => !read.has(n.id)).length;
  const urgentCount = notifications.filter(n => n.priority === "red" && !read.has(n.id)).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => setRead(new Set(notifications.map(n => n.id)));
  const markRead = (id) => setRead(prev => new Set([...prev, id]));

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
        title="Notifikasi"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-xs font-black bg-red-500 text-white rounded-full border-2 border-gray-900">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ border: "1px solid #e5e7eb", maxHeight: 480 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">Notifikasi</span>
              {urgentCount > 0 && (
                <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">
                  {urgentCount} urgent
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Tandai semua dibaca
            </button>
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
            {notifications.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-medium text-sm">Semua beres!</p>
                <p className="text-xs mt-1">Tidak ada notifikasi baru</p>
              </div>
            )}
            {notifications.map(n => {
              const s = PRIORITY_STYLE[n.priority] || PRIORITY_STYLE.blue;
              const isRead = read.has(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 border-l-4 ${s.border} ${isRead ? "opacity-50" : ""}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{n.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${isRead ? "text-gray-400" : "text-gray-900"}`}>{n.message}</p>
                    {n.detail && <p className="text-xs text-gray-400 mt-0.5">{n.detail}</p>}
                    <p className="text-xs text-gray-300 mt-1">{timeAgo(n.ts)}</p>
                  </div>
                  {!isRead && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Lihat semua aktivitas →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
