import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR } from "../../lib/fmt";
import { VENDORS, AP_INVOICES } from "../../data/seed";

const BLANK = { code:"", name:"", category:"Log Supplier", contact:"", email:"", phone:"", payment_terms:"NET 30", bank_name:"", bank_account:"" };
const CATEGORIES = ["Log Supplier","Veneer Supplier","Chemical/Glue","Utilities","Freight & Shipping","Packaging","Other"];
const TERMS = ["NET 15","NET 30","NET 45","NET 60","COD","TT 30"];

export default function Vendors() {
  const [vendors, setVendors] = useState(() =>
    VENDORS.map(v => ({
      ...v,
      open_bills: AP_INVOICES.filter(i=>i.vendor_id===v.id&&i.status!=="Paid").length,
    }))
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:""})); };

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama vendor wajib diisi";
    if (!form.contact.trim()) e.contact = "Nama kontak wajib diisi";
    return e;
  };

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setShowForm(true); };
  const openEdit = (v) => {
    setEditing(v);
    setForm({ code:v.code, name:v.name, category:v.category, contact:v.contact, email:v.email||"", phone:v.phone||"", payment_terms:v.payment_terms, bank_name:v.bank_name||"", bank_account:v.bank_account||"" });
    setErrors({}); setSelected(null); setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (editing) {
      setVendors(vs => vs.map(v => v.id===editing.id ? {...v,...form} : v));
      toast(`Data ${form.name} berhasil diperbarui ✅`);
    } else {
      setVendors(vs => [{id:`v${Date.now()}`, ...form, ap_balance:0, open_bills:0}, ...vs]);
      toast(`Vendor ${form.name} berhasil ditambahkan ✅`);
    }
    setShowForm(false);
  };

  const handleDelete = (v) => {
    if (!window.confirm(`Hapus vendor "${v.name}"?`)) return;
    setVendors(vs => vs.filter(x=>x.id!==v.id));
    setSelected(null);
    toast(`${v.name} dihapus`, "error");
  };

  return (
    <div>
      <PageHeader title="Data Pemasok (Vendor)" subtitle={`${vendors.length} vendor terdaftar`}
        actions={<Btn onClick={openAdd}>+ Tambah Vendor</Btn>} />
      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Cari nama, kategori…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",         label:"Kode",       render:v=><span className="font-mono text-xs text-blue-400">{v||"—"}</span> },
          { key:"name",         label:"Nama Vendor" },
          { key:"category",     label:"Kategori",   render:v=><span className="text-xs text-gray-400">{v}</span> },
          { key:"contact",      label:"Kontak"      },
          { key:"payment_terms",label:"Terms"       },
          { key:"ap_balance",   label:"Saldo AP",   right:true, render:v=><span className={v>0?"font-bold text-amber-300":"text-gray-500"}>{IDR(v||0)}</span> },
          { key:"open_bills",   label:"Tagihan Buka",right:true,render:v=>v>0?<span className="text-amber-400 font-bold">{v}</span>:<span className="text-gray-600">0</span> },
        ]} data={filtered} empty="Belum ada vendor — klik '+ Tambah Vendor'" />
      </Card>

      {selected && (
        <Modal title={selected.name} subtitle={selected.category} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Kode",selected.code||"—"],["Kontak",selected.contact||"—"],["Email",selected.email||"—"],
                ["Telepon",selected.phone||"—"],["Terms Bayar",selected.payment_terms],
                ["Saldo AP",IDR(selected.ap_balance||0)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              <Btn variant="secondary" onClick={()=>openEdit(selected)}>✏️ Edit</Btn>
              <Btn variant="danger" onClick={()=>handleDelete(selected)}>🗑 Hapus</Btn>
              <Btn>+ Buat PO</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal title={editing?"Edit Vendor":"Tambah Vendor Baru"} onClose={()=>setShowForm(false)} width="max-w-xl">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nama Vendor" required>
                <input value={form.name} onChange={set("name")} className={`erp-input ${errors.name?"border-red-500":""}`} placeholder="Nama perusahaan pemasok" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </FormField>
              <FormField label="Kode Vendor">
                <input value={form.code} onChange={set("code")} className="erp-input" placeholder="Contoh: VEND-010" />
              </FormField>
              <FormField label="Nama Kontak" required>
                <input value={form.contact} onChange={set("contact")} className={`erp-input ${errors.contact?"border-red-500":""}`} placeholder="Nama PIC" />
                {errors.contact && <p className="text-xs text-red-400 mt-1">{errors.contact}</p>}
              </FormField>
              <FormField label="Kategori">
                <select value={form.category} onChange={set("category")} className="erp-select">
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Email">
                <input type="email" value={form.email} onChange={set("email")} className="erp-input" placeholder="email@vendor.com" />
              </FormField>
              <FormField label="Telepon">
                <input value={form.phone} onChange={set("phone")} className="erp-input" placeholder="+62-…" />
              </FormField>
              <FormField label="Terms Pembayaran">
                <select value={form.payment_terms} onChange={set("payment_terms")} className="erp-select">
                  {TERMS.map(t=><option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Bank & No. Rekening" sublabel="Untuk pembayaran">
                <input value={form.bank_account} onChange={set("bank_account")} className="erp-input" placeholder="BCA — 1234567890" />
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">{editing?"💾 Simpan":"✅ Tambah Vendor"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
