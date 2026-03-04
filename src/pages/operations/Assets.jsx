import { useState } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, Table, Modal } from "../../components/ui";
import { IDR, DATE } from "../../lib/fmt";
import { ASSETS } from "../../data/seed";

export default function Assets() {
  const [selected, setSelected] = useState(null);
  const totalCost  = ASSETS.reduce((s,a)=>s+a.cost,0);
  const totalBV    = ASSETS.reduce((s,a)=>s+a.book_value,0);
  const totalDep   = ASSETS.reduce((s,a)=>s+a.accum_dep,0);
  const monthlyDep = ASSETS.reduce((s,a)=>s+Math.round((a.cost-a.salvage)/(a.life_years*12)),0);

  return (
    <div>
      <PageHeader title="Fixed Assets" subtitle={`${ASSETS.length} assets`} actions={<Btn>+ Add Asset</Btn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Cost"       value={IDR(totalCost)}    icon="🏗️" />
        <KPICard label="Book Value (Net)" value={IDR(totalBV)}      icon="📊" color="text-blue-400" />
        <KPICard label="Accum. Depreciation" value={IDR(totalDep)} icon="📉" color="text-amber-400" />
        <KPICard label="Monthly Dep."     value={IDR(monthlyDep)}   icon="🗓️" color="text-gray-300" sub="Straight-line" />
      </div>

      <Card>
        <Table onRowClick={setSelected} columns={[
          { key:"asset_no",   label:"Asset No",  render:v=><span className="font-mono text-xs text-blue-400">{v}</span> },
          { key:"name",       label:"Asset Name" },
          { key:"category",   label:"Category"   },
          { key:"purchase_date",label:"Acquired", render:DATE },
          { key:"life_years", label:"Life (yrs)", right:true },
          { key:"cost",       label:"Cost",       right:true, render:v=><span className="font-mono">{IDR(v)}</span> },
          { key:"accum_dep",  label:"Accum. Dep", right:true, render:v=><span className="font-mono text-amber-400">{IDR(v)}</span> },
          { key:"book_value", label:"Book Value", right:true, render:v=><span className="font-mono font-bold text-blue-400">{IDR(v)}</span> },
          { key:"status",     label:"Status",     render:v=><Badge status={v} /> },
        ]} data={ASSETS} />
      </Card>

      {selected && (
        <Modal title={selected.name} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Asset No",selected.asset_no],["Category",selected.category],["Purchase Date",DATE(selected.purchase_date)],
                ["Useful Life",`${selected.life_years} years`],["Depreciation Method",selected.depreciation_method],
                ["Cost",IDR(selected.cost)],["Salvage Value",IDR(selected.salvage)],
                ["Accum. Depreciation",IDR(selected.accum_dep)],["Net Book Value",IDR(selected.book_value)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            {/* Depreciation bar */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Depreciation Progress</p>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="h-3 rounded-full bg-amber-500" style={{width:`${(selected.accum_dep/selected.cost)*100}%`}} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{((selected.accum_dep/selected.cost)*100).toFixed(1)}% depreciated</span>
                <span>Remaining: {IDR(selected.book_value-selected.salvage)}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn>Run Depreciation</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
