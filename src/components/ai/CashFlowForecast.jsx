import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from "recharts";
import { getCashFlowForecast } from "../../lib/aiClient";
import { IDR, DATE } from "../../lib/fmt";

const TT = {
  contentStyle: { background: "#111827", border: "1px solid #374151", borderRadius: 8 },
  labelStyle:   { color: "#f3f4f6", fontSize: 12, fontWeight: "bold" },
  formatter:    (v, name) => [`Rp ${v}jt`, name],
};

// Only show every Nth label so x-axis isn't crowded
const tickEvery = (data, n = 10) => (_, i) => i % n === 0 ? data[i]?.label : "";

export default function CashFlowForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [view,     setView]     = useState("balance"); // balance | flows

  useEffect(() => {
    getCashFlowForecast()
      .then(setForecast)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center text-gray-500">
      <span className="flex items-center gap-2">
        <span className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        Menghitung proyeksi kas…
      </span>
    </div>
  );

  if (error || !forecast) return (
    <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
      Tidak dapat memuat proyeksi kas
    </div>
  );

  const { chartData, initialCash, minBalance, minDate, finalBalance, cumInflow, cumOutflow, narrative, risks, _demo } = forecast;

  // Sample every 3 days for cleaner chart
  const displayData = chartData.filter((_, i) => i % 3 === 0);
  const dangerZone  = 500; // Rp 500jt in millions
  const hasDanger   = minBalance < dangerZone * 1_000_000;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="erp-card p-3 text-center">
          <p className="text-xs text-gray-500">Kas Saat Ini</p>
          <p className="text-lg font-black text-teal-400">{IDR(initialCash)}</p>
        </div>
        <div className="erp-card p-3 text-center">
          <p className="text-xs text-gray-500">Pemasukan (90hr)</p>
          <p className="text-lg font-black text-green-400">+{IDR(cumInflow)}</p>
        </div>
        <div className="erp-card p-3 text-center">
          <p className="text-xs text-gray-500">Pengeluaran (90hr)</p>
          <p className="text-lg font-black text-red-400">-{IDR(cumOutflow)}</p>
        </div>
        <div className={`erp-card p-3 text-center ${hasDanger ? "border-red-500/40" : ""}`}>
          <p className="text-xs text-gray-500">Kas Minimum</p>
          <p className={`text-lg font-black ${hasDanger ? "text-red-400" : "text-white"}`}>
            {IDR(minBalance)}
          </p>
          <p className="text-xs text-gray-600">{DATE(minDate)}</p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {[["balance","📈 Saldo Kas"],["flows","💧 Arus Masuk/Keluar"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${view===k?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {l}
          </button>
        ))}
        {_demo && <span className="ml-auto text-xs text-gray-600 italic self-center">mode demo</span>}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        {view === "balance" ? (
          <AreaChart data={displayData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={hasDanger ? "#ef4444" : "#3b82f6"} stopOpacity={0.3} />
                <stop offset="95%" stopColor={hasDanger ? "#ef4444" : "#3b82f6"} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tickFormatter={tickEvery(displayData, 5)} tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `${v}jt`} />
            <Tooltip {...TT} />
            {hasDanger && (
              <ReferenceLine y={dangerZone} stroke="#ef4444" strokeDasharray="6 3"
                label={{ value: "Batas Aman", fill: "#ef4444", fontSize: 10 }} />
            )}
            <Area type="monotone" dataKey="balance" name="Saldo Kas"
              stroke={hasDanger ? "#ef4444" : "#3b82f6"} strokeWidth={2}
              fill="url(#balGrad)" dot={false} />
          </AreaChart>
        ) : (
          <AreaChart data={displayData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outflowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tickFormatter={tickEvery(displayData, 5)} tick={{ fill: "#9ca3af", fontSize: 10 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={v => `${v}jt`} />
            <Tooltip {...TT} />
            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
            <Area type="monotone" dataKey="cumInflow"  name="Kumulatif Masuk"  stroke="#22c55e" strokeWidth={2} fill="url(#inflowGrad)"  dot={false} />
            <Area type="monotone" dataKey="cumOutflow" name="Kumulatif Keluar" stroke="#ef4444" strokeWidth={2} fill="url(#outflowGrad)" dot={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>

      {/* AI Narrative */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🤖</span>
          <div>
            <p className="text-xs text-blue-400 font-bold mb-1.5">Analisis AI — Proyeksi Arus Kas 90 Hari</p>
            <p className="text-sm text-gray-300 leading-relaxed">{narrative}</p>
          </div>
        </div>
      </div>

      {/* Risk items */}
      {risks?.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">⚠️ Periode Risiko</p>
          <div className="space-y-1.5">
            {risks.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs">
                <span className="text-red-300">{DATE(r.date)}</span>
                <span className="text-red-400 font-bold">{IDR(r.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
