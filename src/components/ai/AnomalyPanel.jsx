import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAnomalies } from "../../lib/aiClient";
import { Btn } from "../ui";

const SEVERITY_STYLE = {
  high:   { border: "border-red-500/30",    bg: "bg-red-500/10",    badge: "bg-red-500/20 text-red-300",    label: "Penting"   },
  medium: { border: "border-amber-500/30",  bg: "bg-amber-500/10",  badge: "bg-amber-500/20 text-amber-300", label: "Perhatian" },
  low:    { border: "border-blue-500/30",   bg: "bg-blue-500/10",   badge: "bg-blue-500/20 text-blue-300",   label: "Info"      },
};

const TYPE_ROUTE = {
  duplicate:       "/finance/ap",
  unusual_amount:  "/finance/ap",
  overdue_ar:      "/finance/ar",
  concentration:   "/finance/ap",
  cashflow:        "/finance/reports",
};

export default function AnomalyPanel({ compact = false }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [dismissed, setDismissed] = useState(new Set());
  const [expanded,  setExpanded]  = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    getAnomalies()
      .then(setData)
      .catch(() => setData({ anomalies: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-gray-500 py-4">
      <span className="w-4 h-4 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      Menganalisis anomali…
    </div>
  );

  const anomalies = (data?.anomalies || []).filter(a => !dismissed.has(a.title));
  if (!anomalies.length) return (
    <div className="flex items-center gap-3 py-4 text-sm text-green-400">
      <span className="text-xl">✅</span>
      <span>Tidak ada anomali terdeteksi — semua transaksi terlihat normal</span>
    </div>
  );

  const high   = anomalies.filter(a => a.severity === "high");
  const medium = anomalies.filter(a => a.severity === "medium");
  const low    = anomalies.filter(a => a.severity === "low");

  if (compact) {
    // Dashboard compact mode — show summary bar
    return (
      <div className="space-y-2">
        {anomalies.slice(0, 3).map(a => {
          const s = SEVERITY_STYLE[a.severity];
          return (
            <button key={a.title}
              onClick={() => navigate(TYPE_ROUTE[a.type] || "/")}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl border ${s.border} ${s.bg} hover:opacity-80 transition-opacity group`}>
              <span className="text-xl flex-shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{a.title}</p>
                <p className="text-xs text-gray-400 truncate">{a.description.slice(0, 80)}…</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${s.badge}`}>{s.label}</span>
              <span className="text-gray-500 group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          );
        })}
        {anomalies.length > 3 && (
          <button onClick={() => navigate("/ai")} className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-1">
            +{anomalies.length - 3} anomali lainnya — lihat semua →
          </button>
        )}
      </div>
    );
  }

  // Full mode (used in /ai page)
  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {[["high","🔴","Penting",high.length],["medium","⚠️","Perhatian",medium.length],["low","🔵","Info",low.length]]
          .filter(([,,, n]) => n > 0)
          .map(([sev, icon, label, count]) => (
            <div key={sev} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${SEVERITY_STYLE[sev].badge}`}>
              {icon} {count} {label}
            </div>
          ))}
        {data?._demo && <span className="ml-auto text-xs text-gray-600 italic self-center">mode demo</span>}
      </div>

      {/* Anomaly cards */}
      <div className="space-y-3">
        {anomalies.map(a => {
          const s = SEVERITY_STYLE[a.severity];
          const isExpanded = expanded.has(a.title);
          return (
            <div key={a.title} className={`border ${s.border} ${s.bg} rounded-xl overflow-hidden`}>
              <div className="flex items-start gap-3 p-4">
                <span className="text-2xl flex-shrink-0 mt-0.5">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-bold text-white text-sm">{a.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${s.badge}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{a.description}</p>

                  {isExpanded && (
                    <div className="mt-3 p-3 bg-gray-900/60 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tindakan yang Disarankan</p>
                      <p className="text-xs text-gray-200">{a.action}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <Btn size="xs" variant="ghost" onClick={() => {
                    setExpanded(s => { const n = new Set(s); n.has(a.title) ? n.delete(a.title) : n.add(a.title); return n; });
                  }}>
                    {isExpanded ? "▲" : "▼"}
                  </Btn>
                  <Btn size="xs" variant="ghost" onClick={() => setDismissed(s => new Set([...s, a.title]))}>
                    ✕
                  </Btn>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 flex gap-2">
                  <Btn size="xs" variant="secondary" onClick={() => navigate(TYPE_ROUTE[a.type] || "/")}>
                    Lihat Detail →
                  </Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
