import { useState } from "react";
import { PageHeader, Card, Btn, KPICard } from "../../components/ui";
import { PCT, NUM } from "../../lib/fmt";
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from "recharts";

// ── Seed OEE data (mirrors production-monitor-phi.vercel.app) ─────────────────
const WORKSTATIONS = [
  { id: "ws1", name: "Line 1 – Rotary Lathe",    short: "Rotary Lathe",  oee: 78.2, avail: 90.1, perf: 87.3, quality: 99.2, yield_pct: 88.4, output: 1840, target: 2000, downtime_hr: 2.8, unit: "lembar" },
  { id: "ws2", name: "Line 2 – Gluing & Assembly",short: "Gluing",        oee: 83.5, avail: 93.0, perf: 91.2, quality: 98.5, yield_pct: 91.0, output: 4550, target: 5000, downtime_hr: 1.6, unit: "lembar" },
  { id: "ws3", name: "Line 3 – Hot Press A",      short: "Hot Press A",   oee: 71.4, avail: 82.5, perf: 87.6, quality: 99.0, yield_pct: 85.2, output: 2260, target: 2800, downtime_hr: 4.4, unit: "lembar" },
  { id: "ws4", name: "Line 4 – Hot Press B",      short: "Hot Press B",   oee: 74.8, avail: 85.0, perf: 89.0, quality: 98.8, yield_pct: 86.7, output: 2350, target: 2800, downtime_hr: 3.6, unit: "lembar" },
  { id: "ws5", name: "Line 5 – Sanding & Finishing",short: "Sanding",     oee: 88.1, avail: 95.2, perf: 93.5, quality: 99.0, yield_pct: 93.2, output: 4820, target: 5200, downtime_hr: 1.1, unit: "lembar" },
  { id: "ws6", name: "Line 6 – Trimming & QC",    short: "Trim & QC",     oee: 92.3, avail: 97.1, perf: 95.5, quality: 99.5, yield_pct: 96.0, output: 4800, target: 5000, downtime_hr: 0.6, unit: "lembar" },
];

const TREND_7D = [
  { day: "Sen", oee: 77.2, yield_pct: 88.0 },
  { day: "Sel", oee: 79.5, yield_pct: 89.2 },
  { day: "Rab", oee: 75.8, yield_pct: 87.5 },
  { day: "Kam", oee: 82.3, yield_pct: 90.4 },
  { day: "Jum", oee: 80.1, yield_pct: 89.8 },
  { day: "Sab", oee: 78.9, yield_pct: 88.5 },
  { day: "Min", oee: 80.6, yield_pct: 90.0 },
];

const OEE_TOOLTIP = {
  contentStyle: { background: "#FFFFFF", border: "1px solid #DDD8CC", borderRadius: 10, boxShadow: "0 4px 14px rgba(26,28,20,0.08)" },
  labelStyle: { color: "#1E2414", fontWeight: 700 },
};

// ── OEE Gauge ─────────────────────────────────────────────────────────────────
function OEEGauge({ value, size = 80 }) {
  const color = value >= 85 ? "#1B6830" : value >= 70 ? "#F0C200" : "#DC2626";
  const data  = [{ name: "OEE", value: value, fill: color }];
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <RadialBarChart width={size} height={size} cx={size/2} cy={size/2}
        innerRadius={size*0.32} outerRadius={size*0.46} startAngle={210} endAngle={-30}
        data={[{ value: 100 }]} barSize={size*0.12}>
        <RadialBar dataKey="value" fill="#E5DFD3" cornerRadius={4} />
      </RadialBarChart>
      <div className="absolute inset-0">
        <RadialBarChart width={size} height={size} cx={size/2} cy={size/2}
          innerRadius={size*0.32} outerRadius={size*0.46} startAngle={210} endAngle={210 - (value/100)*240}
          data={data} barSize={size*0.12}>
          <RadialBar dataKey="value" fill={color} cornerRadius={4} />
        </RadialBarChart>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black" style={{ color, fontSize: size * 0.17 }}>{value.toFixed(0)}%</span>
      </div>
    </div>
  );
}

// ── OEE Component bar ─────────────────────────────────────────────────────────
function OEEBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-bold" style={{ color }}>{PCT(value)}</span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "oee",   label: "OEE & Yield",     icon: "📊" },
  { id: "ws",    label: "Per Workstation", icon: "🏭" },
  { id: "trend", label: "Tren 7 Hari",     icon: "📈" },
  { id: "ext",   label: "Monitor Penuh",   icon: "↗" },
];

export default function Production() {
  const [tab, setTab]   = useState("oee");
  const [selWS, setSelWS] = useState(null);

  const avgOEE    = WORKSTATIONS.reduce((a,w) => a + w.oee, 0) / WORKSTATIONS.length;
  const avgYield  = WORKSTATIONS.reduce((a,w) => a + w.yield_pct, 0) / WORKSTATIONS.length;
  const totalDown = WORKSTATIONS.reduce((a,w) => a + w.downtime_hr, 0);
  const totalOut  = WORKSTATIONS.reduce((a,w) => a + w.output, 0);

  return (
    <div>
      <PageHeader
        title="Produksi"
        subtitle="OEE · Yield · Workstation performance"
        actions={
          <a href="https://production-monitor-phi.vercel.app" target="_blank" rel="noopener noreferrer">
            <Btn variant="secondary">🏭 Full Production Monitor ↗</Btn>
          </a>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="OEE Rata-rata" sublabel="Avg OEE" icon="⚙️"
          value={PCT(avgOEE)}
          color={avgOEE >= 85 ? "text-green-700" : avgOEE >= 70 ? "text-amber-700" : "text-red-700"}
          sub="Availability × Performance × Quality"
          accent="kpi-gold"
        />
        <KPICard label="Yield Rata-rata" sublabel="Avg Yield" icon="📦"
          value={PCT(avgYield)}
          color={avgYield >= 90 ? "text-green-700" : "text-amber-700"}
          sub="Output baik / Input aktual"
          accent="kpi-green"
        />
        <KPICard label="Total Downtime" sublabel="Hari ini" icon="⏱️"
          value={`${totalDown.toFixed(1)} jam`}
          color="text-red-700"
          sub={`${WORKSTATIONS.length} workstation aktif`}
          accent="kpi-red"
        />
        <KPICard label="Output Produksi" sublabel="Hari ini" icon="🪵"
          value={NUM(totalOut)}
          color="text-gray-900"
          sub="Total lembar diproduksi"
          accent="kpi-blue"
        />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id
                ? "bg-white shadow-sm text-gray-900 border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: OEE Summary ──────────────────────────────────────────────── */}
      {tab === "oee" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OEE gauges grid */}
          <Card title="OEE per Workstation" subtitle="Real-time · hari ini">
            <div className="grid grid-cols-2 gap-4">
              {WORKSTATIONS.map(ws => (
                <button key={ws.id} onClick={() => { setSelWS(ws); setTab("ws"); }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-brand-gold hover:bg-gray-50 transition-all text-left">
                  <OEEGauge value={ws.oee} size={60} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 leading-tight">{ws.short}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Yield: <span className="font-semibold text-gray-700">{PCT(ws.yield_pct)}</span></p>
                    <p className="text-xs text-gray-400">Downtime: <span className="text-red-600 font-semibold">{ws.downtime_hr}j</span></p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* OEE bar chart */}
          <Card title="OEE vs Target (≥85%)" subtitle="Per lini produksi">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={WORKSTATIONS} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                <XAxis dataKey="short" tick={{ fontSize: 10, fill: "#6E6D5C" }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: "#6E6D5C" }} domain={[0, 100]} />
                <Tooltip {...OEE_TOOLTIP} formatter={(v) => [`${v.toFixed(1)}%`]} />
                <Bar dataKey="oee" name="OEE %" radius={[4,4,0,0]} fill="#F0C200" />
                <Bar dataKey="yield_pct" name="Yield %" radius={[4,4,0,0]} fill="#1B6830" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-400 mt-1 text-center">🟡 OEE &nbsp;🟢 Yield — Target garis: 85%</p>
          </Card>
        </div>
      )}

      {/* ── Tab: Per Workstation ──────────────────────────────────────────── */}
      {tab === "ws" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* WS list */}
          <div className="space-y-2">
            {WORKSTATIONS.map(ws => {
              const active = selWS?.id === ws.id;
              const color = ws.oee >= 85 ? "border-green-300 bg-green-50" : ws.oee >= 70 ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50";
              return (
                <button key={ws.id} onClick={() => setSelWS(ws)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${active ? color + " ring-2 ring-brand-gold" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                  <OEEGauge value={ws.oee} size={48} />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{ws.short}</p>
                    <p className="text-xs text-gray-500">Yield {PCT(ws.yield_pct)} · ⬇{ws.downtime_hr}j</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* WS Detail */}
          <div className="md:col-span-2">
            {selWS ? (
              <Card title={selWS.name} subtitle="OEE breakdown detail">
                <div className="space-y-5">
                  {/* Big OEE gauge + components */}
                  <div className="flex items-center gap-8">
                    <OEEGauge value={selWS.oee} size={100} />
                    <div className="flex-1 space-y-3">
                      <OEEBar label={`Availability / Ketersediaan`} value={selWS.avail}   color="#2563EB" />
                      <OEEBar label={`Performance / Performa`}      value={selWS.perf}    color="#F0C200" />
                      <OEEBar label={`Quality / Kualitas`}          value={selWS.quality} color="#1B6830" />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Output", sublabel: "Produksi aktual", value: NUM(selWS.output), unit: "lembar", color: "text-gray-900" },
                      { label: "Target", sublabel: "Rencana produksi", value: NUM(selWS.target), unit: "lembar", color: "text-gray-500" },
                      { label: "Yield",  sublabel: "Tingkat hasil",    value: PCT(selWS.yield_pct), unit: "", color: selWS.yield_pct >= 90 ? "text-green-700" : "text-amber-700" },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-400">{s.unit || s.sublabel}</p>
                      </div>
                    ))}
                  </div>

                  {/* Downtime */}
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">⏱️ Downtime Hari Ini</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-red-700">{selWS.downtime_hr} jam</p>
                        <p className="text-xs text-red-500 mt-0.5">
                          {selWS.downtime_hr >= 4 ? "⚠️ Tinggi — perlu investigasi" :
                           selWS.downtime_hr >= 2 ? "🔶 Sedang — pantau terus" : "✅ Normal"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{PCT((selWS.downtime_hr / 8) * 100)}</p>
                        <p className="text-xs text-red-700">dari 8 jam shift</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <a href="https://production-monitor-phi.vercel.app" target="_blank" rel="noopener noreferrer">
                      <Btn variant="secondary">🏭 Detail lengkap di Production Monitor ↗</Btn>
                    </a>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <p className="text-4xl mb-3">🏭</p>
                  <p className="font-medium text-gray-600">Pilih workstation di sebelah kiri</p>
                  <p className="text-sm mt-1">untuk melihat detail OEE & Yield</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Trend 7 Days ─────────────────────────────────────────────── */}
      {tab === "trend" && (
        <Card title="Tren OEE & Yield — 7 Hari Terakhir" subtitle="Rata-rata semua workstation">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={TREND_7D} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6E6D5C" }} />
              <YAxis tick={{ fontSize: 11, fill: "#6E6D5C" }} domain={[60, 100]} />
              <Tooltip {...OEE_TOOLTIP} formatter={(v) => [`${v.toFixed(1)}%`]} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#6E6D5C" }} />
              <Line type="monotone" dataKey="oee"      name="OEE %"   stroke="#F0C200" strokeWidth={2.5} dot={{ r: 4, fill: "#F0C200" }} />
              <Line type="monotone" dataKey="yield_pct" name="Yield %" stroke="#1B6830" strokeWidth={2.5} dot={{ r: 4, fill: "#1B6830" }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-600 font-bold uppercase tracking-wide">OEE Tren 7 Hari</p>
              <p className="text-xl font-black text-amber-700">{PCT(TREND_7D.reduce((a,d) => a+d.oee, 0)/7)}</p>
              <p className="text-xs text-amber-500">Rata-rata mingguan</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
              <p className="text-xs text-green-700 font-bold uppercase tracking-wide">Yield Tren 7 Hari</p>
              <p className="text-xl font-black text-green-700">{PCT(TREND_7D.reduce((a,d) => a+d.yield_pct, 0)/7)}</p>
              <p className="text-xs text-green-500">Rata-rata mingguan</p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Tab: External link ────────────────────────────────────────────── */}
      {tab === "ext" && (
        <Card>
          <div className="p-6 flex items-start gap-6">
            <div className="text-6xl">🏭</div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-gray-900 mb-2">Full Production Monitor</h3>
              <p className="text-gray-500 mb-4">Sistem monitoring produksi lengkap — work orders, downtime log, Pareto analysis, proses routing, dan lebih banyak lagi.</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-5">
                {["OEE per workstation (A × P × Q)", "7-day production run history", "Downtime log dengan MTTR/MTBF",
                  "Work order management", "Live machine status board", "Process flow routing editor",
                  "Pareto downtime analysis", "CSV export"
                ].map(f => (
                  <div key={f} className="flex items-start gap-2 text-gray-600">
                    <span className="text-green-600 mt-0.5">✓</span><span>{f}</span>
                  </div>
                ))}
              </div>
              <a href="https://production-monitor-phi.vercel.app" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                🏭 Buka Production Monitor ↗
              </a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
