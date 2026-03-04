import { PageHeader, Card, Btn, EmptyState } from "../../components/ui";

export default function Production() {
  return (
    <div>
      <PageHeader title="Production" actions={
        <a href="https://production-monitor-phi.vercel.app" target="_blank" rel="noopener noreferrer">
          <Btn variant="secondary">🏭 Open Production Monitor ↗</Btn>
        </a>
      } />
      <Card>
        <div className="p-6">
          <div className="flex items-start gap-6">
            <div className="text-6xl">🏭</div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-white mb-2">Production Monitor</h3>
              <p className="text-gray-400 mb-4">Full-featured Production & OEE monitoring is managed separately in the Production Monitor app. It covers:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {["OEE per workstation (Availability × Performance × Quality)",
                  "7-day production run history",
                  "Downtime log with MTTR/MTBF",
                  "Work order management",
                  "Live machine status board",
                  "Process flow routing editor",
                  "Pareto downtime analysis",
                  "CSV export"
                ].map(f=>(
                  <div key={f} className="flex items-start gap-2 text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span><span>{f}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <a href="https://production-monitor-phi.vercel.app" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  🏭 Open Production Monitor ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
