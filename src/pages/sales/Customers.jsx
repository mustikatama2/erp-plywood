import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR } from "../../lib/fmt";
import { CUSTOMERS, AR_INVOICES, SALES_ORDERS } from "../../data/seed";
import { useAuth } from "../../contexts/AuthContext";

const BLANK = { code:"", name:"", country:"Indonesia", contact:"", email:"", phone:"", payment_terms:"NET 30", currency:"IDR", credit_limit:"", status:"Active" };
const COUNTRIES = ["Indonesia","Japan","China","South Korea","UAE","Australia","USA","Malaysia","Singapore","India","Germany","Netherlands"];
const TERMS     = ["NET 30","NET 45","NET 60","TT 30","TT 45","LC 60","LC 90","COD"];
const CURRENCIES= ["IDR","USD","SGD","EUR","JPY"];

export default function Customers() {
  const { can } = useAuth();
  const canEdit = can("/sales/customers");

  const [customers, setCustomers] = useState(() =>
    CUSTOMERS.map(c => ({
      ...c,
      open_invoices: AR_INVOICES.filter(i=>i.customer_id===c.id&&i.status!=="Paid").length,
      total_so: SALES_ORDERS.filter(s=>s.customer_id===c.id).length,
    }))
  );

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null); // null = add, obj = edit
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:""})); };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama customer wajib diisi";
    if (!form.contact.trim()) e.contact = "Nama kontak wajib diisi";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid";
    return e;
  };

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK);
    setErrors({});
    setShowForm(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ code:c.code, name:c.name, country:c.country, contact:c.contact, email:c.email||"", phone:c.phone||"", payment_terms:c.payment_terms, currency:c.currency, credit_limit:String(c.credit_limit||""), status:c.status });
    setErrors({});
    setSelected(null);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (editing) {
      setCustomers(cs => cs.map(c => c.id===editing.id
        ? {...c, ...form, credit_limit:Number(form.credit_limit)||0}
        : c
      ));
      toast(`Data ${form.name} berhasil diperbarui ✅`);
    } else {
      const newC = {
        id: `c${Date.now()}`,
        ...form,
        credit_limit: Number(form.credit_limit) || 0,
        ar_balance: 0,
        open_invoices: 0,
        total_so: 0,
      };
      setCustomers(cs => [newC, ...cs]);
      toast(`Customer ${form.name} berhasil ditambahkan ✅`);
    }
    setShowForm(false);
  };

  const handleDelete = (c) => {
    if (!window.confirm(`Hapus customer "${c.name}"?`)) return;
    setCustomers(cs => cs.filter(x => x.id !== c.id));
    setSelected(null);
    toast(`${c.name} dihapus`, "error");
  };

  return (
    <div>
      <PageHeader title="Data Pelanggan" subtitle={`${customers.length} customer terdaftar`}
        actions={canEdit && <Btn onClick={openAdd}>+ Tambah Customer</Btn>} />

      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari nama, kode, negara…" />
          <p className="text-xs text-gray-500">{filtered.length} dari {customers.length} ditampilkan</p>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",         label:"Kode",         render:v=><span className="font-mono text-xs text-blue-400">{v||"—"}</span> },
          { key:"name",         label:"Nama Customer" },
          { key:"country",      label:"Negara",       render:v=><span className="text-xs">{v}</span> },
          { key:"payment_terms",label:"Terms Bayar"   },
          { key:"currency",     label:"Mata Uang",    render:v=><span className="text-xs font-mono">{v}</span> },
          { key:"ar_balance",   label:"Saldo AR",     right:true, render:(v,r)=>(
            <span className={v>0?"font-bold text-amber-300":"text-gray-500"}>
              {r.currency} {(v||0).toLocaleString()}
            </span>
          )},
          { key:"open_invoices",label:"Invoice Buka", right:true, render:v=>v>0?<span className="text-amber-400 font-bold">{v}</span>:<span className="text-gray-600">0</span> },
          { key:"status",       label:"Status",       render:v=><Badge status={v} /> },
        ]} data={filtered} empty="Tidak ada customer ditemukan — klik '+ Tambah Customer' untuk menambah" />
      </Card>

      {/* Detail modal */}
      {selected && (
        <Modal title={selected.name} subtitle={`${selected.country} · ${selected.code||"Tanpa kode"}`} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Kontak",selected.contact||"—"],["Email",selected.email||"—"],["Telepon",selected.phone||"—"],
                ["Terms Bayar",selected.payment_terms],["Mata Uang",selected.currency],
                ["Limit Kredit",IDR(selected.credit_limit||0)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="erp-card p-3 text-center">
                <p className={`text-2xl font-black ${selected.ar_balance>0?"text-amber-300":"text-gray-400"}`}>
                  {selected.currency} {(selected.ar_balance||0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Piutang Belum Diterima</p>
              </div>
              <div className="erp-card p-3 text-center">
                <p className="text-2xl font-black text-white">{selected.total_so}</p>
                <p className="text-xs text-gray-500 mt-1">Total Sales Order</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              {canEdit && <>
                <Btn variant="secondary" onClick={()=>openEdit(selected)}>✏️ Edit</Btn>
                <Btn variant="danger" onClick={()=>handleDelete(selected)}>🗑 Hapus</Btn>
                <Btn onClick={()=>{setSelected(null);}}>+ Buat Sales Order</Btn>
              </>}
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <Modal title={editing ? `Edit: ${editing.name}` : "Tambah Customer Baru"} onClose={()=>setShowForm(false)} width="max-w-2xl">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nama Customer" required>
                <input value={form.name} onChange={set("name")} className={`erp-input ${errors.name?"border-red-500":""}`} placeholder="Contoh: PT. Jaya Abadi" />
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
              </FormField>
              <FormField label="Kode Customer" sublabel="Opsional — akan dibuat otomatis jika kosong">
                <input value={form.code} onChange={set("code")} className="erp-input" placeholder="Contoh: CUST-010" />
              </FormField>
              <FormField label="Nama Kontak" required>
                <input value={form.contact} onChange={set("contact")} className={`erp-input ${errors.contact?"border-red-500":""}`} placeholder="Nama PIC / kontak utama" />
                {errors.contact && <p className="text-xs text-red-400 mt-1">{errors.contact}</p>}
              </FormField>
              <FormField label="Negara">
                <select value={form.country} onChange={set("country")} className="erp-select">
                  {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Email">
                <input type="email" value={form.email} onChange={set("email")} className={`erp-input ${errors.email?"border-red-500":""}`} placeholder="email@perusahaan.com" />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
              </FormField>
              <FormField label="Telepon">
                <input value={form.phone} onChange={set("phone")} className="erp-input" placeholder="+62-21-…" />
              </FormField>
              <FormField label="Terms Pembayaran" tip="Berapa lama customer harus membayar setelah menerima invoice">
                <select value={form.payment_terms} onChange={set("payment_terms")} className="erp-select">
                  {TERMS.map(t=><option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Mata Uang">
                <select value={form.currency} onChange={set("currency")} className="erp-select">
                  {CURRENCIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Limit Kredit (IDR)" sublabel="Batas maksimal piutang yang diizinkan" tip="Jika saldo piutang melebihi limit ini, sistem akan memberi peringatan">
                <input type="number" value={form.credit_limit} onChange={set("credit_limit")} className="erp-input" placeholder="Contoh: 500000000" />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={set("status")} className="erp-select">
                  <option>Active</option><option>Closed</option>
                </select>
              </FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">{editing ? "💾 Simpan Perubahan" : "✅ Tambah Customer"}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
