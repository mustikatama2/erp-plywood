import { useState } from "react";
import { useActivity } from "../contexts/ActivityContext";

const ACTION_STYLES = {
  CREATE:  { icon: "✅", color: "text-green-700",  bg: "bg-green-50",  label: "Membuat"   },
  UPDATE:  { icon: "✏️", color: "text-amber-700",  bg: "bg-amber-50",  label: "Memperbarui" },
  DELETE:  { icon: "🗑️", color: "text-red-700",    bg: "bg-red-50",    label: "Menghapus"  },
  APPROVE: { icon: "✅", color: "text-blue-700",   bg: "bg-blue-50",   label: "Menyetujui" },
  REJECT:  { icon: "❌", color: "text-red-700",    bg: "bg-red-50",    label: "Menolak"    },
  LOGIN:   { icon: "🔐", color: "text-gray-600",   bg: "bg-gray-50",   label: "Login"      },
  PAYMENT: { icon: "💰", color: "text-blue-700",   bg: "bg-blue-50",   label: "Pembayaran" },
  POST:    { icon: "📒", color: "text-purple-700", bg: "bg-purple-50", label: "Posting"    },
};

const MODULE_COLORS = {
  Sales:      "text-blue-700",
  Purchasing: "text-purple-700",
  Finance:    "text-green-700",
  Inventory:  "text-teal-700",
  HR:         "text-pink-700",
  Production: "text-orange-700",
  Admin:      "text-gray-700",
};

const MODULES = ["All", "Sales", "Finance", "Purchasing", "Inventory", "HR", "Production", "Admin"];

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60) return `${diff} detik lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function RoleAvatar({ user }) {
  const roleColors = {
    admin:      "bg-red-500",
    finance:    "bg-green-500",
    sales:      "bg-blue-500",
    purchasing: "bg-purple-500",
    warehouse:  "bg-teal-500",
    hr:         "bg-pink-500",
    viewer:     "bg-gray-500",
    system:     "bg-gray-400",
  };
  const color = roleColors[user?.role] || "bg-gray-500";
  const initial = user?.name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
      {initial}
    </div>
  );
}

function ActivityItem({ entry, compact }) {
  const style = ACTION_STYLES[entry.action] || ACTION_STYLES.UPDATE;
  const modColor = MODULE_COLORS[entry.module] || "text-gray-700";

  if (compact) {
    return (
      <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
        <RoleAvatar user={entry.user} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-700 leading-snug line-clamp-2">
            <span className={`font-semibold ${style.color}`}>{style.icon} </span>
            {entry.description}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.timestamp)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className={`w-8 h-8 rounded-full ${style.bg} flex items-center justify-center text-base flex-shrink-0`}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800">{entry.description}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <RoleAvatar user={entry.user} />
              <span className="text-xs text-gray-600 font-medium">{entry.user?.name}</span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${style.bg} ${style.color}`}>{entry.action}</span>
              <span className={`text-xs font-medium ${modColor}`}>{entry.module}</span>
            </div>
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{timeAgo(entry.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

export default function ActivityFeed({ limit = 10, module = null, compact = false }) {
  const { log } = useActivity();
  const [activeModule, setActiveModule] = useState(module || "All");

  const filtered = log
    .filter(e => activeModule === "All" || e.module === activeModule)
    .slice(0, compact ? limit : Math.max(limit, 50));

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">📋</span>
          <h3 className="text-sm font-bold text-gray-900">Aktivitas Terbaru</h3>
        </div>
        <div>
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Belum ada aktivitas</p>
          ) : (
            filtered.map(e => <ActivityItem key={e.id} entry={e} compact />)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="erp-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Aktivitas Terbaru</h3>
            <p className="text-xs text-gray-500">{log.length} entri tersimpan</p>
          </div>
        </div>
      </div>

      {/* Module filter */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {MODULES.map(m => (
          <button key={m} onClick={() => setActiveModule(m)}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeModule === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}>
            {m}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Belum ada aktivitas untuk modul ini</p>
        ) : (
          filtered.map(e => <ActivityItem key={e.id} entry={e} compact={false} />)
        )}
      </div>
    </div>
  );
}
