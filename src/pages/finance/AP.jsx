import { useState } from "react";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, DATE, badge } from "../../lib/fmt";
import { AP_INVOICES, VENDORS } from "../../data/seed";
import { DocumentParserButton } from "../../components/ai/DocumentParser";
import { useJournal } from "../../contexts/JournalContext";
import DocumentTrail from "../../components/DocumentTrail";

const EMPTY_FORM = {
  vendor_id:"", inv_no:"", date:"", due_date:"", description:"", total:"", currency:"IDR", notes:""
};

function NewBillModal({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  // Called when AI parser extracts data → fill form fields
  const handleExtracted = (data) => {
    const matchedVendor = VENDORS.find(v =>
      v.name.toLowerCase().includes((data.vendor_name || "").toLowerCase().split(" ")[0])
    );
    setForm(f => ({
      ...f,
      vendor_id:   matchedVendor?.id || f.vendor_id,
      inv_no:      data.inv_no      || f.inv_no,
      date:        data.date        || f.date,
      due_date:    data.due_date    || f.due_date,
      description: data.description || f.description,
      total:       data.total ? String(data.total) : f.total,
      currency:    data.currency    || f.currency,
      notes:       data.notes       || f.notes,
    }));
    toast("✅ Form diisi dari dokumen — periksa dan sesuaikan sebelum menyimpan");
  };

  const handleSave = async () => {
    if (!form.vendor_id) { toast("Pilih vendor terlebih dahulu", "error"); return; }
    if (!form.total)     { toast("Masukkan jumlah tagihan", "error"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800)); // simulate API
    toast("✅ Tagihan vendor berhasil dicatat");
    onSave?.();
    onClose();
  };

  return (
    <Modal title="+ Tagihan Baru" subtitle="Buat hutang vendor baru" onClose={onClose} width="max-w-xl">
      <div className="p-5 space-y-4">

        {/* AI Parser button — prominently placed at the top */}
        <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div>
            <p className="text-sm font-bold text-blue-300">🤖 Parse Otomatis dengan AI</p>
            <p className="text-xs text-gray-400">Tempelkan teks faktur → AI isi form secara otomatis</p>
          </div>
          <DocumentParserButton onExtracted={handleExtracted} />
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          {/* Vendor select */}
          <div>
            <label className="erp-label">Vendor <span className="text-red-700">*</span></label>
            <select value={form.vendor_id} onChange={set("vendor_id")} className="erp-input">
              <option value="">-- Pilih Vendor --</option>
              {VENDORS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">No. Invoice Vendor <span className="text-red-700">*</span></label>
              <input value={form.inv_no} onChange={set("inv_no")} className="erp-input" placeholder="SINV-2026-001" />
            </div>
            <div>
              <label className="erp-label">Mata Uang</label>
              <select value={form.currency} onChange={set("currency")} className="erp-input">
                <option>IDR</option><option>USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="erp-label">Tanggal Invoice</label>
              <input type="date" value={form.date} onChange={set("date")} className="erp-input" />
            </div>
            <div>
              <label className="erp-label">Jatuh Tempo</label>
              <input type="date" value={form.due_date} onChange={set("due_date")} className="erp-input" />
            </div>
          </div>

          <div>
            <label className="erp-label">Deskripsi</label>
            <input value={form.description} onChange={set("description")} className="erp-input" placeholder="Log Meranti Grade A, 85 m³…" />
          </div>

          <div>
            <label className="erp-label">Jumlah Total <span className="text-red-700">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{form.currency === "USD" ? "$" : "Rp"}</span>
              <input
                type="number" value={form.total} onChange={set("total")}
                className="erp-input pl-9" placeholder="80750000"
              />
            </div>
            {form.total && <p className="text-xs text-gray-500 mt-1">{IDR(Number(form.total))}</p>}
          </div>

          {form.notes && (
            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-400">
              📝 Catatan AI: {form.notes}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : "💾 Simpan Tagihan"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function AP() {
  const journal = useJournal();

  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("All");
  const [selected,setSelected]= useState(null);
  const [newBill, setNewBill] = useState(false);
  const [bills,   setBills]   = useState(AP_INVOICES);

  const enriched = bills.map(i => ({
    ...i, vendor: VENDORS.find(v=>v.id===i.vendor_id),
  }));

  const STATUSES = ["All","Unpaid","Overdue","Paid"];
  const filtered = enriched
    .filter(i=>filter==="All"||i.status===filter)
    .filter(i=>i.inv_no.toLowerCase().includes(search.toLowerCase())||
               i.vendor?.name.toLowerCase().includes(search.toLowerCase()));

  const total   = enriched.filter(i=>i.status!=="Paid").reduce((s,i)=>s+i.balance,0);
  const overdue = enriched.filter(i=>i.status==="Overdue").reduce((s,i)=>s+i.balance,0);

  return (
    <div>
      <PageHeader title="Hutang Dagang (AP)" subtitle="Tagihan vendor & jadwal pembayaran"
        actions={<>
          <Btn variant="secondary">📤 Export</Btn>
          <Btn onClick={() => setNewBill(true)}>+ Tagihan Baru</Btn>
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Hutang"   sublabel="AP Outstanding" value={IDR(total)}   color="text-amber-700" icon="📥" />
        <KPICard label="Jatuh Tempo"    sublabel="Overdue"        value={IDR(overdue)} color="text-red-700"   icon="🔴" />
        <KPICard label="Tagihan Terbuka"sublabel="Open Bills"     value={enriched.filter(i=>i.status!=="Paid").length} icon="📄" />
        <KPICard label="Vendor Aktif"   sublabel="with balance"   value={new Set(enriched.filter(i=>i.balance>0).map(i=>i.vendor_id)).size} icon="🏢" />
      </div>

      {/* AI parser hint banner */}
      <div className="mb-4 flex items-center gap-3 px-4 py-2.5 bg-blue-500/8 border border-blue-500/15 rounded-xl text-sm">
        <span>🤖</span>
        <span className="text-gray-400">Tagihan baru? Klik <strong className="text-gray-900">+ Tagihan Baru</strong> lalu gunakan <strong className="text-blue-700">Parse Otomatis AI</strong> — tempel teks invoice, form terisi sendiri.</span>
      </div>

      <Card>
        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Cari no. tagihan, vendor…" />
          <div className="flex gap-1.5 flex-wrap">
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>setFilter(s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${filter===s?"bg-blue-600 text-white":"bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                {s==="All"?"Semua":s==="Unpaid"?"Belum Bayar":s==="Overdue"?"Jatuh Tempo":"Lunas"}{" "}
                <span className="ml-1 opacity-70">{s==="All"?enriched.length:enriched.filter(i=>i.status===s).length}</span>
              </button>
            ))}
          </div>
        </div>
        <Table onRowClick={setSelected} columns={[
          { key:"inv_no",     label:"Bill No",      render:v=><span className="font-mono font-bold text-blue-700">{v}</span> },
          { key:"vendor",     label:"Vendor",       render:v=>v?.name.split(" ").slice(0,3).join(" ") },
          { key:"date",       label:"Tanggal",      render:DATE },
          { key:"due_date",   label:"Jatuh Tempo",  render:(v,r)=>{
            const od = new Date(v)<new Date()&&r.status!=="Paid";
            return <span className={od?"text-red-700 font-bold":"text-gray-700"}>{DATE(v)}{od?" ⚠️":""}</span>;
          }},
          { key:"description",label:"Deskripsi",    render:v=><span className="text-xs text-gray-400">{v}</span> },
          { key:"total",      label:"Total",        right:true, render:v=><span className="font-mono">{IDR(v)}</span> },
          { key:"balance",    label:"Sisa",         right:true, render:v=><span className={v>0?"font-black text-amber-700":"text-gray-500"}>{IDR(v)}</span> },
          { key:"status",     label:"Status",       render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {/* Detail / payment modal */}
      {selected && (
        <Modal title={`Tagihan ${selected.inv_no}`} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Vendor",selected.vendor?.name],["Tanggal Tagihan",DATE(selected.date)],
                ["Jatuh Tempo",DATE(selected.due_date)],["Deskripsi",selected.description],
                ["Total",IDR(selected.total)],["Sudah Dibayar",IDR(selected.paid)]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium">{v}</p></div>
              ))}
            </div>
            <div className="erp-card p-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">Sisa Tagihan</span>
              <span className={`text-2xl font-black ${selected.balance>0?"text-amber-700":"text-green-700"}`}>{IDR(selected.balance)}</span>
            </div>
            <DocumentTrail
              refId={selected.id}
              refType="AP"
              blNo={null}
              soId={null}
            />
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              {selected.balance > 0 && (
                <Btn variant="success" onClick={()=>{
                  journal.postAPPayment(selected, selected.balance);
                  toast("✅ Pembayaran berhasil dicatat");
                  setSelected(null);
                }}>
                  💳 Catat Pembayaran
                </Btn>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* New bill modal with AI parser */}
      {newBill && (
        <NewBillModal
          onClose={() => setNewBill(false)}
          onSave={() => {}}
        />
      )}
    </div>
  );
}
