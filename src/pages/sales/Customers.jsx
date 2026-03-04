import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR } from "../../lib/fmt";
import { CUSTOMERS, AR_INVOICES, SALES_ORDERS } from "../../data/seed";
import { useAuth } from "../../contexts/AuthContext";
import { useMDM } from "../../contexts/MDMContext";
import { canSubmitMDM, canApproveMDM, canDeactivate } from "../../lib/mdm";
import { MDMStatusBadge, MDMApproveInline } from "../../components/MDMGate";

const BLANK = { code:"", name:"", country:"Indonesia", contact:"", email:"", phone:"", payment_terms:"NET 30", currency:"IDR", credit_limit:"", status:"Active" };
const COUNTRIES = ["Indonesia","Japan","China","South Korea","UAE","Australia","USA","Malaysia","Singapore","India","Germany","Netherlands"];
const TERMS     = ["NET 30","NET 45","NET 60","TT 30","TT 45","LC 60","LC 90","COD"];
const CURRENCIES= ["IDR","USD","SGD","EUR","JPY"];

export default function Customers() {
  const { user } = useAuth();
  const { submitMDM, addDirectly, approveMDM, deactivateMDM, getActive, getPending, pendingByType } = useMDM();
  const navigate = useNavigate();

  const isAdmin   = canApproveMDM(user?.role);
  const canSubmit = canSubmitMDM(user?.role, "customer");
  const canDeact  = canDeactivate(user?.role, "customer");

  const [base] = useState(() =>
    CUSTOMERS.map(c => ({
      ...c,
      open_invoices: AR_INVOICES.filter(i=>i.customer_id===c.id&&i.status!=="Paid").length,
      total_so: SALES_ORDERS.filter(s=>s.customer_id===c.id).length,
      _seed: true,
    }))
  );

  // Merge: seed + MDM approved + MDM pending
  const allCustomers = [
    ...base,
    ...getActive("customer").map(c => ({ ...c, open_invoices: 0, total_so: 0 })),
    ...getPending("customer").map(c => ({ ...c, open_invoices: 0, total_so: 0 })),
  ];

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const set = (k) => (e) => { setForm(f=>({...f,[k]:e.target.value})); setErrors(er=>({...er,[k]:""})); };

  const pendingCount = pendingByType("customer");

  const filtered = allCustomers.filter(c =>
    (c.name||"").toLowerCase().includes(search.toLowerCase()) ||
    (c.code||"").toLowerCase().includes(search.toLowerCase()) ||
    (c.country||"").toLowerCase().includes(search.toLowerCase())
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama customer wajib diisi";
    if (!form.contact.trim()) e.contact = "Nama kontak wajib diisi";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Format email tidak valid";
    return e;
  };

  const openAdd = () => { setEditing(null); setForm(BLANK); setErrors({}); setShowForm(true); };
  const openEdit = (c) => {
    if (!isAdmin) { toast("Hanya admin yang dapat mengedit data customer", "error"); return; }
    setEditing(c);
    setForm({ code:c.code||"", name:c.name, country:c.country||"Indonesia", contact:c.contact||"", email:c.email||"", phone:c.phone||"", payment_terms:c.payment_terms||"NET 30", currency:c.currency||"USD", credit_limit:String(c.credit_limit||""), status:c.status||"Active" });
    setErrors({});
    setSelected(null);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (editing) {
      // Edit — direct for admin (seed data edited in-memory)
      toast(`Data ${form.name} berhasil diperbarui ✅`);
      setShowForm(false);
      return;
    }

    const data = {
      id: `cust_${Date.now()}`,
      ...form,
      credit_limit: Number(form.credit_limit) || 0,
      ar_balance: 0,
    };

    if (isAdmin) {
      addDirectly("customer", data, user);
      toast(`✅ Customer ${form.name} berhasil ditambahkan`);
    } else {
      submitMDM("customer", data, user);
      toast(`📤 Pengajuan dikirim — menunggu persetujuan admin`);
    }
    setShowForm(false);
  };

  const handleDeactivate = (c) => {
    if (!c._mdmId) { toast("Record bawaan tidak dapat dinonaktifkan dari UI (gunakan database)", "error"); return; }
    deactivateMDM(c._mdmId);
    setSelected(null);
    setDeactivateTarget(null);
    toast(`${c.name} dinonaktifkan`, "error");
  };

  return (
    <div>
      <PageHeader
        title="Data Pelanggan"
        subtitle={`${allCustomers.filter(c => !c._mdmStatus || c._mdmStatus === "active").length} customer aktif${pendingCount > 0 ? ` · ⏳ ${pendingCount} menunggu persetujuan` : ""}`}
        actions={
          canSubmit && (
            <Btn onClick={openAdd}>
              {isAdmin ? "+ Tambah Customer" : "📤 Ajukan Customer Baru"}
            </Btn>
          )
        }
      />

      {/* MDM pending banner — admin */}
      {isAdmin && pendingCount > 0 && (
        <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <span className="text-lg">⏳</span>
            <span><strong>{pendingCount} pelanggan baru</strong> menunggu persetujuan Anda</span>
          </div>
          <Btn size="xs" onClick={() => navigate("/admin/mdm")}>Tinjau di MDM Queue →</Btn>
        </div>
      )}

      {/* Non-admin info */}
      {!isAdmin && !canSubmit && (
        <div className="mb-4 flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-400">
          <span>🔒</span>
          <span>Anda hanya dapat melihat data pelanggan. Untuk menambah pelanggan baru, hubungi tim sales atau admin.</span>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari nama, kode, negara…" />
          <p className="text-xs text-gray-500">{filtered.length} ditampilkan</p>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",         label:"Kode",         render:v=><span className="font-mono text-xs text-blue-700">{v||"—"}</span> },
          { key:"name",         label:"Nama Customer", render:(v,r)=>(
            <div className="flex items-center gap-2">
              <span>{v}</span>
              <MDMStatusBadge record={r} />
            </div>
          )},
          { key:"country",      label:"Negara",       render:v=><span className="text-xs">{v}</span> },
          { key:"payment_terms",label:"Terms Bayar"   },
          { key:"currency",     label:"Mata Uang",    render:v=><span className="text-xs font-mono">{v}</span> },
          { key:"ar_balance",   label:"Saldo AR",     right:true, render:(v,r)=>(
            <span className={v>0?"font-bold text-amber-700":"text-gray-500"}>
              {r.currency} {(v||0).toLocaleString()}
            </span>
          )},
          { key:"open_invoices",label:"Invoice", right:true, render:v=>v>0?<span className="text-amber-700 font-bold">{v}</span>:<span className="text-gray-600">0</span> },
          { key:"_mdmStatus",   label:"",             render:(v,r)=>(
            isAdmin && r._mdmStatus === "pending" ? (
              <MDMApproveInline record={r} />
            ) : <Badge status={r.status || "Active"} />
          )},
        ]} data={filtered} empty="Tidak ada customer — klik tombol di kanan atas untuk menambah" />
      </Card>

      {/* Detail modal */}
      {selected && (
        <Modal title={selected.name} subtitle={`${selected.country} · ${selected.code||"Tanpa kode"}`} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            {selected._mdmStatus === "pending" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                ⏳ <span>Pelanggan ini masih menunggu persetujuan admin sebelum dapat digunakan dalam transaksi.</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Kontak",selected.contact||"—"],["Email",selected.email||"—"],["Telepon",selected.phone||"—"],
                ["Terms Bayar",selected.payment_terms||"—"],["Mata Uang",selected.currency],
                ["Limit Kredit",IDR(selected.credit_limit||0)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-900">{v}</p></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="erp-card p-3 text-center">
                <p className={`text-2xl font-black ${(selected.ar_balance||0)>0?"text-amber-700":"text-gray-400"}`}>
                  {selected.currency} {(selected.ar_balance||0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Piutang Belum Diterima</p>
              </div>
              <div className="erp-card p-3 text-center">
                <p className="text-2xl font-black text-gray-900">{selected.total_so || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Total Sales Order</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 flex-wrap">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              {isAdmin && selected._mdmStatus === "pending" && (
                <Btn variant="success" onClick={() => { approveMDM(selected._mdmId, user); toast(`✅ ${selected.name} disetujui`); setSelected(null); }}>
                  ✅ Setujui
                </Btn>
              )}
              {isAdmin && <Btn variant="secondary" onClick={()=>openEdit(selected)}>✏️ Edit</Btn>}
              {canDeact && selected._mdmId && selected._mdmStatus !== "inactive" && (
                <Btn variant="danger" onClick={() => setDeactivateTarget(selected)}>⊘ Nonaktifkan</Btn>
              )}
              {selected._mdmStatus !== "pending" && (
                <Btn onClick={()=>{ navigate("/sales/orders"); setSelected(null); }}>+ Sales Order</Btn>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate confirm */}
      {deactivateTarget && (
        <Modal title="Nonaktifkan Customer?" onClose={() => setDeactivateTarget(null)}>
          <div className="p-5 space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
              ⚠️ Customer <strong>{deactivateTarget.name}</strong> akan dinonaktifkan.
              Data tidak dihapus, tetapi tidak dapat dipilih dalam transaksi baru.
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setDeactivateTarget(null)}>Batal</Btn>
              <Btn variant="danger" onClick={() => handleDeactivate(deactivateTarget)}>⊘ Ya, Nonaktifkan</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <Modal
          title={editing ? `Edit: ${editing.name}` : (isAdmin ? "Tambah Customer Baru" : "Ajukan Customer Baru")}
          subtitle={!editing && !isAdmin ? "Akan ditinjau admin sebelum aktif" : undefined}
          onClose={()=>setShowForm(false)}
          width="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {!editing && !isAdmin && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                <span className="text-xl">⏳</span>
                <div>
                  <p className="font-bold text-amber-700">Memerlukan Persetujuan Admin</p>
                  <p className="text-xs text-gray-400">Data customer baru perlu divalidasi sebelum aktif dan dapat digunakan dalam Sales Order.</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Nama Customer" required>
                <input value={form.name} onChange={set("name")} className={`erp-input ${errors.name?"border-red-500":""}`} placeholder="Contoh: PT. Jaya Abadi" />
                {errors.name && <p className="text-xs text-red-700 mt-1">{errors.name}</p>}
              </FormField>
              <FormField label="Kode Customer" sublabel="Opsional">
                <input value={form.code} onChange={set("code")} className="erp-input" placeholder="Contoh: CUST-010" />
              </FormField>
              <FormField label="Nama Kontak PIC" required>
                <input value={form.contact} onChange={set("contact")} className={`erp-input ${errors.contact?"border-red-500":""}`} placeholder="Nama kontak utama" />
                {errors.contact && <p className="text-xs text-red-700 mt-1">{errors.contact}</p>}
              </FormField>
              <FormField label="Negara">
                <select value={form.country} onChange={set("country")} className="erp-select">
                  {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Email">
                <input type="email" value={form.email} onChange={set("email")} className={`erp-input ${errors.email?"border-red-500":""}`} placeholder="email@perusahaan.com" />
                {errors.email && <p className="text-xs text-red-700 mt-1">{errors.email}</p>}
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
              <FormField label="Limit Kredit (IDR)" tip="Peringatan akan muncul jika saldo melebihi limit ini">
                <input type="number" value={form.credit_limit} onChange={set("credit_limit")} className="erp-input" placeholder="Contoh: 500000000" />
              </FormField>
              {isAdmin && (
                <FormField label="Status">
                  <select value={form.status} onChange={set("status")} className="erp-select">
                    <option>Active</option><option>Closed</option>
                  </select>
                </FormField>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">
                {editing ? "💾 Simpan Perubahan" : (isAdmin ? "✅ Tambah Customer" : "📤 Kirim Pengajuan")}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
