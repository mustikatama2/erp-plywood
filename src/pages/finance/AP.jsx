import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageHeader, Card, Btn, Badge, KPICard, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, DATE, badge, exportCSV } from "../../lib/fmt";
import { AP_INVOICES, VENDORS } from "../../data/seed";
import { DocumentParserButton } from "../../components/ai/DocumentParser";
import { useJournal } from "../../contexts/JournalContext";
import DocumentTrail from "../../components/DocumentTrail";

// ── AP Aging Analysis ─────────────────────────────────────────────────────────
function APAgingBuckets({ bills, vendors }) {
  const today = new Date();

  const aging = useMemo(() => {
    const map = {};
    bills.filter(b => b.status !== "Paid" && b.balance > 0).forEach(b => {
      const vid = b.vendor_id;
      if (!map[vid]) map[vid] = { vendor: vendors.find(v => v.id === vid), b0: 0, b30: 0, b60: 0, b90: 0 };
      const days = Math.round((today - new Date(b.due_date)) / 86400000);
      if      (days <= 30)  map[vid].b0  += b.balance;
      else if (days <= 60)  map[vid].b30 += b.balance;
      else if (days <= 90)  map[vid].b60 += b.balance;
      else                  map[vid].b90 += b.balance;
    });
    return Object.values(map).map(r => ({
      ...r,
      total: r.b0 + r.b30 + r.b60 + r.b90,
      name: r.vendor?.name?.split(" ").slice(0, 3).join(" ") || "—",
    }));
  }, [bills, vendors]);

  const totals = aging.reduce((s, r) => ({
    b0: s.b0 + r.b0, b30: s.b30 + r.b30,
    b60: s.b60 + r.b60, b90: s.b90 + r.b90,
    total: s.total + r.total,
  }), { b0: 0, b30: 0, b60: 0, b90: 0, total: 0 });

  const chartData = aging.map(r => ({
    name: r.name,
    "0-30 hr": Math.round(r.b0 / 1e6),
    "31-60 hr": Math.round(r.b30 / 1e6),
    "61-90 hr": Math.round(r.b60 / 1e6),
    "90+ hr": Math.round(r.b90 / 1e6),
  }));

  return (
    <div className="space-y-5 mt-5">
      <Card title="AP Aging per Vendor (Rp Juta)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }} />
            <Bar dataKey="0-30 hr"  stackId="a" fill="#22c55e" />
            <Bar dataKey="31-60 hr" stackId="a" fill="#f59e0b" />
            <Bar dataKey="61-90 hr" stackId="a" fill="#f97316" />
            <Bar dataKey="90+ hr"   stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs justify-center flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-green-500" /> 0–30 hr</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-amber-500" /> 31–60 hr</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-orange-500" /> 61–90 hr</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block bg-red-500" /> 90+ hr</span>
        </div>
      </Card>

      <Card title="Detail Aging per Vendor">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-green-700 uppercase tracking-wider">0–30 hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-amber-700 uppercase tracking-wider">31–60 hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-orange-700 uppercase tracking-wider">61–90 hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-red-700 uppercase tracking-wider">90+ hr</th>
                <th className="text-right py-2.5 px-3 text-xs font-bold text-gray-700 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {aging.map(r => (
                <tr key={r.vendor?.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{r.name}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-green-700">{r.b0 > 0 ? IDR(r.b0) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">{r.b30 > 0 ? IDR(r.b30) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-orange-700">{r.b60 > 0 ? IDR(r.b60) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-red-700">{r.b90 > 0 ? IDR(r.b90) : <span className="text-gray-300">—</span>}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-gray-900">{IDR(r.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-black">
                <td className="py-2.5 px-3 text-gray-700 text-sm uppercase tracking-wider">Total</td>
                <td className="py-2.5 px-3 text-right font-mono text-green-700 text-sm">{IDR(totals.b0)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-amber-700 text-sm">{IDR(totals.b30)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-orange-700 text-sm">{IDR(totals.b60)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-red-700 text-sm">{IDR(totals.b90)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-gray-900 text-sm">{IDR(totals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
}

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

  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("All");
  const [selected,  setSelected]  = useState(null);
  const [newBill,   setNewBill]   = useState(false);
  const [bills,     setBills]     = useState(AP_INVOICES);
  const [showAging, setShowAging] = useState(false);

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
          <Btn variant="secondary" onClick={() => setShowAging(a => !a)}>
            {showAging ? "📋 Hide Aging" : "📊 Aging Analysis"}
          </Btn>
          <Btn variant="secondary" onClick={() => exportCSV(enriched.map(b=>({inv_no:b.inv_no,vendor:b.vendor?.name,description:b.description,total:b.total,paid:b.paid,balance:b.balance,status:b.status,due_date:b.due_date})),"ap_hutang.csv")}>📤 Export</Btn>
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

      {showAging && (
        <APAgingBuckets bills={enriched} vendors={VENDORS} />
      )}

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
                  setBills(prev => prev.map(b => b.id === selected.id
                    ? { ...b, paid: b.total, balance: 0, status: "Paid" }
                    : b
                  ));
                  toast("✅ Pembayaran AP berhasil dicatat & jurnal diposting");
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
