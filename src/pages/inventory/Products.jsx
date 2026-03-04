import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, NUM } from "../../lib/fmt";
import { PRODUCTS } from "../../data/seed";

export default function Products() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const CATS = [...new Set(PRODUCTS.map(p=>p.category))];

  return (
    <div>
      <PageHeader title="Products" subtitle={`${PRODUCTS.length} items`} actions={<Btn>+ Add Product</Btn>} />

      {/* Category summary */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {CATS.map(cat => {
          const items = PRODUCTS.filter(p=>p.category===cat);
          return (
            <div key={cat} className="erp-card px-4 py-2.5 text-sm">
              <span className="text-gray-400">{cat}</span>
              <span className="ml-2 font-black text-white">{items.length}</span>
            </div>
          );
        })}
      </div>

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search name, code, category…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",      label:"Code",       render:v=><span className="font-mono text-xs font-bold text-blue-400">{v}</span> },
          { key:"name",      label:"Product"     },
          { key:"category",  label:"Category",   render:v=><span className="text-xs text-gray-400">{v}</span> },
          { key:"spec",      label:"Spec",        render:v=><span className="text-xs text-gray-500">{v}</span> },
          { key:"unit",      label:"Unit"         },
          { key:"price_idr", label:"Price (IDR)", right:true, render:v=>v?<span className="font-mono">{IDR(v)}</span>:"—" },
          { key:"stock_qty", label:"Stock",       right:true, render:(v,r)=>(
            <span className={v<r.reorder?"text-red-400 font-black":"font-mono"}>
              {NUM(v)} {v<r.reorder?" ⚠️":""}
            </span>
          )},
          { key:"reorder",   label:"Reorder Pt", right:true, render:v=><span className="text-gray-500">{NUM(v)}</span> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.name} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Code",selected.code],["Category",selected.category],["Unit",selected.unit],
                ["Spec",selected.spec],["Price IDR",IDR(selected.price_idr)],["Price USD",selected.price_usd?`$ ${selected.price_usd}`:"—"]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`erp-card p-3 text-center ${selected.stock_qty<selected.reorder?"border-red-500/40":""}`}>
                <p className={`text-2xl font-black ${selected.stock_qty<selected.reorder?"text-red-400":"text-white"}`}>{NUM(selected.stock_qty)}</p>
                <p className="text-xs text-gray-500">Current Stock ({selected.unit})</p>
                {selected.stock_qty < selected.reorder && <p className="text-xs text-red-400 mt-1">⚠️ Below reorder point</p>}
              </div>
              <div className="erp-card p-3 text-center">
                <p className="text-2xl font-black text-amber-300">{NUM(selected.reorder)}</p>
                <p className="text-xs text-gray-500">Reorder Point</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="secondary">Stock Movement</Btn>
              <Btn>Edit</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
