import { PageHeader, Card, KPICard } from "../../components/ui";
import { IDR, NUM } from "../../lib/fmt";
import { PRODUCTS, WAREHOUSES } from "../../data/seed";

export default function StockLevels() {
  const plywood = PRODUCTS.filter(p=>p.category==="Plywood");
  const raw     = PRODUCTS.filter(p=>p.category==="Raw Material"||p.category==="Chemical");
  const totalValue = PRODUCTS.reduce((s,p)=>(s + (p.stock_qty||0)*(p.price_idr||0)),0);
  const lowStock   = PRODUCTS.filter(p=>p.stock_qty<p.reorder).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-lg font-black">Stock Levels</h2><p className="text-xs text-gray-500">As of today · Main Warehouse</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Total SKUs"        value={PRODUCTS.length}    icon="📦" />
        <KPICard label="Inventory Value"   value={IDR(totalValue)}    icon="💰" color="text-green-400" />
        <KPICard label="Low Stock Alerts"  value={lowStock}           icon="⚠️" color={lowStock?"text-red-400":"text-white"} />
        <KPICard label="Warehouses"        value={WAREHOUSES.length}  icon="🏭" />
      </div>

      {[["🪵 Finished Goods — Plywood", plywood], ["🧪 Raw Materials & Chemicals", raw]].map(([title, items])=>(
        <div key={title} className="erp-card mb-5">
          <div className="px-5 py-3 border-b border-gray-800"><h3 className="font-bold text-sm text-gray-300">{title}</h3></div>
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead><tr><th>Product</th><th>Code</th><th className="text-right">Stock Qty</th><th className="text-right">Reorder Point</th><th>Status</th><th className="text-right">Value (IDR)</th></tr></thead>
              <tbody>
                {items.map(p=>{
                  const low = p.stock_qty < p.reorder;
                  const fillPct = Math.min(100, (p.stock_qty/(p.reorder*3))*100);
                  return (
                    <tr key={p.id}>
                      <td><p className="font-medium">{p.name}</p><p className="text-xs text-gray-500">{p.spec}</p></td>
                      <td><span className="font-mono text-xs text-blue-400">{p.code}</span></td>
                      <td className="text-right">
                        <span className={`font-black ${low?"text-red-400":"text-white"}`}>{NUM(p.stock_qty)}</span>
                        <span className="text-xs text-gray-500 ml-1">{p.unit}</span>
                        <div className="w-24 bg-gray-800 rounded-full h-1.5 mt-1 ml-auto">
                          <div className={`h-1.5 rounded-full ${low?"bg-red-500":"bg-blue-500"}`} style={{width:`${fillPct}%`}} />
                        </div>
                      </td>
                      <td className="text-right text-gray-500">{NUM(p.reorder)}</td>
                      <td>
                        {low
                          ? <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">Low Stock</span>
                          : <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">OK</span>
                        }
                      </td>
                      <td className="text-right font-mono">{p.price_idr?IDR(p.stock_qty*p.price_idr):"—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
