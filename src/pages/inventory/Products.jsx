import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, NUM } from "../../lib/fmt";
import { PRODUCTS } from "../../data/seed";

const CATS = ["Plywood","Blockboard","MDF","Raw Material","Chemical","Packaging","Other"];
const UNITS = ["sheets","m3","kg","pcs","roll","set"];
const BLANK = { code:"", name:"", category:"Plywood", unit:"sheets", spec:"", price_idr:"", price_usd:"", stock_qty:"", reorder:"" };

export default function Products() {
  const [products, setProducts] = useState(PRODUCTS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:""})); };

  const cats = ["All",...new Set(products.map(p=>p.category))];
  const filtered = products
    .filter(p => catFilter==="All" || p.category===catFilter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()));

  const validate = () => {
    const e={};
    if(!form.name.trim()) e.name="Nama produk wajib diisi";
    return e;
  };

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ code:p.code, name:p.name, category:p.category, unit:p.unit, spec:p.spec||"",
      price_idr:String(p.price_idr||""), price_usd:String(p.price_usd||""), stock_qty:String(p.stock_qty||0), reorder:String(p.reorder||0) });
    setErrors({}); setSelected(null); setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if(Object.keys(errs).length){setErrors(errs);return;}
    const data = { ...form, price_idr:Number(form.price_idr)||null, price_usd:Number(form.price_usd)||null, stock_qty:Number(form.stock_qty)||0, reorder:Number(form.reorder)||0 };
    if(editing){
      setProducts(ps=>ps.map(p=>p.id===editing.id?{...p,...data}:p));
      toast(`${form.name} berhasil diperbarui ✅`);
    } else {
      setProducts(ps=>[{id:`p${Date.now()}`,...data},...ps]);
      toast(`Produk ${form.name} ditambahkan ✅`);
    }
    setShowForm(false);
  };

  const handleDelete = (p) => {
    if(!window.confirm(`Hapus produk "${p.name}"?`)) return;
    setProducts(ps=>ps.filter(x=>x.id!==p.id));
    setSelected(null);
    toast(`${p.name} dihapus`,"error");
  };

  return (
    <div>
      <PageHeader title="Daftar Produk" subtitle={`${products.length} produk`}
        actions={<Btn onClick={openAdd}>+ Tambah Produk</Btn>} />

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {cats.map(c=>(
          <button key={c} onClick={()=>setCatFilter(c)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${catFilter===c?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {c} <span className="opacity-60">{c==="All"?products.length:products.filter(p=>p.category===c).length}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Cari nama, kode produk…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",      label:"Kode",       render:v=><span className="font-mono text-xs text-blue-400">{v||"—"}</span> },
          { key:"name",      label:"Nama Produk" },
          { key:"category",  label:"Kategori",   render:v=><span className="text-xs text-gray-400">{v}</span> },
          { key:"unit",      label:"Satuan"      },
          { key:"price_idr", label:"Harga (IDR)",right:true, render:v=>v?<span className="font-mono text-xs">{IDR(v)}</span>:"—" },
          { key:"stock_qty", label:"Stok",       right:true, render:(v,r)=>(
            <span className={v<r.reorder?"text-red-400 font-black":"font-mono"}>
              {NUM(v)} {v<r.reorder&&r.reorder>0?" ⚠️":""}
            </span>
          )},
          { key:"reorder",   label:"Reorder",    right:true, render:v=><span className="text-xs text-gray-500">{NUM(v)||"—"}</span> },
        ]} data={filtered} empty="Belum ada produk — klik '+ Tambah Produk'" />
      </Card>

      {selected && (
        <Modal title={selected.name} subtitle={`${selected.category} · ${selected.code||"Tanpa kode"}`} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Spesifikasi",selected.spec||"—"],["Satuan",selected.unit],
                ["Harga IDR",selected.price_idr?IDR(selected.price_idr):"—"],
                ["Harga USD",selected.price_usd?`$ ${selected.price_usd}`:"—"]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`erp-card p-3 text-center ${selected.stock_qty<selected.reorder&&selected.reorder>0?"border border-red-500/40":""}`}>
                <p className={`text-2xl font-black ${selected.stock_qty<selected.reorder&&selected.reorder>0?"text-red-400":"text-white"}`}>{NUM(selected.stock_qty)}</p>
                <p className="text-xs text-gray-500 mt-1">Stok ({selected.unit})</p>
                {selected.stock_qty<selected.reorder&&selected.reorder>0 && <p className="text-xs text-red-400 mt-1">⚠️ Di bawah reorder point</p>}
              </div>
              <div className="erp-card p-3 text-center">
                <p className="text-2xl font-black text-amber-300">{NUM(selected.reorder||0)}</p>
                <p className="text-xs text-gray-500 mt-1">Reorder Point</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              <Btn variant="secondary" onClick={()=>openEdit(selected)}>✏️ Edit</Btn>
              <Btn variant="danger" onClick={()=>handleDelete(selected)}>🗑 Hapus</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal title={editing?"Edit Produk":"Tambah Produk Baru"} onClose={()=>setShowForm(false)} width="max-w-xl">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nama Produk" required>
                <input value={form.name} onChange={set("name")} className={`erp-input ${errors.name?"border-red-500":""}`} placeholder="Contoh: Plywood 18mm Marine" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </FormField>
              <FormField label="Kode Produk">
                <input value={form.code} onChange={set("code")} className="erp-input" placeholder="Contoh: PLY-1800M" />
              </FormField>
              <FormField label="Kategori">
                <select value={form.category} onChange={set("category")} className="erp-select">
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Satuan">
                <select value={form.unit} onChange={set("unit")} className="erp-select">
                  {UNITS.map(u=><option key={u}>{u}</option>)}
                </select>
              </FormField>
              <div className="md:col-span-2">
                <FormField label="Spesifikasi" sublabel="Dimensi, grade, standar kualitas">
                  <input value={form.spec} onChange={set("spec")} className="erp-input" placeholder="Contoh: 18mm × 1220×2440 / BB-CC / E1" />
                </FormField>
              </div>
              <FormField label="Harga IDR (per satuan)">
                <input type="number" value={form.price_idr} onChange={set("price_idr")} className="erp-input" placeholder="0" />
              </FormField>
              <FormField label="Harga USD (per satuan)">
                <input type="number" step="0.01" value={form.price_usd} onChange={set("price_usd")} className="erp-input" placeholder="0.00" />
              </FormField>
              <FormField label="Stok Awal">
                <input type="number" value={form.stock_qty} onChange={set("stock_qty")} className="erp-input" placeholder="0" />
              </FormField>
              <FormField label="Reorder Point" tip="Sistem akan memberi peringatan jika stok di bawah angka ini">
                <input type="number" value={form.reorder} onChange={set("reorder")} className="erp-input" placeholder="0" />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">{editing?"💾 Simpan":"✅ Tambah Produk"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
