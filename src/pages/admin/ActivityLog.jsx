import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, SearchBar, KPICard } from "../../components/ui";
import { exportCSV } from "../../lib/fmt";
import { useActivity } from "../../contexts/ActivityContext";

const ACTION_COLORS = {
  CREATE:  "bg-green-100 text-green-700",
  UPDATE:  "bg-amber-100 text-amber-700",
  DELETE:  "bg-red-100 text-red-700",
  APPROVE: "bg-blue-100 text-blue-700",
  REJECT:  "bg-red-100 text-red-700",
  LOGIN:   "bg-gray-100 text-gray-700",
  PAYMENT: "bg-blue-100 text-blue-700",
  POST:    "bg-purple-100 text-purple-700",
};

const ACTION_ICONS = {
  CREATE:  "✅",
  UPDATE:  "✏️",
  DELETE:  "🗑️",
  APPROVE: "👍",
  REJECT:  "❌",
  LOGIN:   "🔐",
  PAYMENT: "💰",
  POST:    "📒",
};

const MODULES  = ["All", "Sales", "Finance", "Purchasing", "Inventory", "HR", "Production", "Admin"];
const ACTIONS  = ["All", "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "LOGIN", "PAYMENT", "POST"];

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000);
  if (diff < 60) return `${diff}d lalu`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
  return new Date(isoStr).toLocaleString("id-ID", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
}

function RoleAvatar({ user }) {
  const colors = {
    admin: "bg-red-500", finance: "bg-green-500", sales: "bg-blue-500",
    purchasing: "bg-purple-500", warehouse: "bg-teal-500", hr: "bg-pink-500",
    viewer: "bg-gray-500", system: "bg-gray-400",
  };
  return (
    <div className={`w-7 h-7 rounded-full ${colors[user?.role] || "bg-gray-400"} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
      {user?.name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function ActivityLog() {
  const { log } = useActivity();

  const [search, setSearch]         = useState("");
  const [moduleFilter, setModule]   = useState("All");
  const [actionFilter, setAction]   = useState("All");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  const filtered = useMemo(() => {
    return log.filter(e => {
      if (moduleFilter !== "All" && e.module !== moduleFilter) return false;
      if (actionFilter !== "All" && e.action !== actionFilter) return false;
      if (dateFrom && new Date(e.timestamp) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.timestamp) > new Date(dateTo + "T23:59:59")) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          e.description.toLowerCase().includes(s) ||
          e.entity_label.toLowerCase().includes(s) ||
          e.user?.name.toLowerCase().includes(s) ||
          e.module.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [log, moduleFilter, actionFilter, dateFrom, dateTo, search]);

  // KPI counts
  const today = new Date().toISOString().split("T")[0];
  const todayCount = log.filter(e => e.timestamp.startsWith(today)).length;
  const createCount = log.filter(e => e.action === "CREATE").length;
  const paymentCount = log.filter(e => e.action === "PAYMENT").length;

  const handleExport = () => {
    exportCSV(
      filtered.map(e => ({
        timestamp: e.timestamp,
        user: e.user?.name,
        role: e.user?.role,
        action: e.action,
        module: e.module,
        entity: e.entity_label,
        description: e.description,
      })),
      "activity-log.csv"
    );
  };

  return (
    <div>
      <PageHeader
        title="Log Aktivitas"
        subtitle={`${log.length} entri aktivitas tersimpan`}
        actions={
          <Btn variant="secondary" onClick={handleExport}>📤 Export CSV</Btn>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Aktivitas" sublabel="All time" value={log.length} icon="📋" />
        <KPICard label="Hari Ini" sublabel="Today's activity" value={todayCount} icon="📅" color="text-blue-700" />
        <KPICard label="Data Baru Dibuat" sublabel="CREATE events" value={createCount} icon="✅" color="text-green-700" />
        <KPICard label="Pembayaran Dicatat" sublabel="PAYMENT events" value={paymentCount} icon="💰" color="text-purple-700" />
      </div>

      <Card>
        {/* Filters */}
        <div className="space-y-3 mb-4 pb-4 border-b border-gray-100">
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-48">
              <SearchBar value={search} onChange={setSearch} placeholder="Cari aktivitas, entitas, pengguna…" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500 font-medium">Dari Tanggal</p>
              <input type="date" className="erp-input text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-500 font-medium">Sampai Tanggal</p>
              <input type="date" className="erp-input text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(search || moduleFilter !== "All" || actionFilter !== "All" || dateFrom || dateTo) && (
              <Btn variant="secondary" size="sm" onClick={() => { setSearch(""); setModule("All"); setAction("All"); setDateFrom(""); setDateTo(""); }}>
                ✕ Reset
              </Btn>
            )}
          </div>

          {/* Module pills */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Modul</p>
            <div className="flex gap-1.5 flex-wrap">
              {MODULES.map(m => (
                <button key={m} onClick={() => setModule(m)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${moduleFilter === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Action pills */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">Tipe Aksi</p>
            <div className="flex gap-1.5 flex-wrap">
              {ACTIONS.map(a => (
                <button key={a} onClick={() => setAction(a)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${actionFilter === a ? "bg-blue-600 text-white" : ACTION_COLORS[a] || "bg-gray-100 text-gray-500 hover:bg-gray-200"} ${actionFilter === a ? "" : "opacity-80"}`}>
                  {ACTION_ICONS[a] || ""} {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-xs text-gray-400 mb-3">{filtered.length} hasil ditemukan</p>

        {/* Timeline */}
        <div className="space-y-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Tidak ada aktivitas yang cocok dengan filter</p>
          ) : (
            filtered.map((entry, idx) => (
              <div key={entry.id} className={`flex items-start gap-3 py-3 ${idx < filtered.length - 1 ? "border-b border-gray-50" : ""} hover:bg-gray-50/50 rounded-lg px-2 transition-colors`}>
                {/* Timeline dot */}
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-700"}`}>
                    {ACTION_ICONS[entry.action] || "•"}
                  </div>
                  {idx < filtered.length - 1 && (
                    <div className="w-px h-3 bg-gray-200 mt-1" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{entry.description}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <RoleAvatar user={entry.user} />
                        <span className="text-xs text-gray-600 font-medium">{entry.user?.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${ACTION_COLORS[entry.action] || "bg-gray-100 text-gray-600"}`}>
                          {entry.action}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{entry.module}</span>
                        <span className="text-xs font-mono text-gray-400">{entry.entity_label}</span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap mt-0.5">{timeAgo(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
