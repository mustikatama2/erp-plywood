import { useState, useMemo } from "react";
import { PageHeader, Card, Btn, KPICard, Badge, Modal, FormField, toast } from "../../components/ui";
import { IDR, DATE, NUM } from "../../lib/fmt";
import { CUSTOMERS, SALES_ORDERS, SHIPMENTS } from "../../data/seed";

const today = new Date();
const todayStr = today.toISOString().split("T")[0];

function daysFrom(dateStr) {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr) - today) / 86400000);
}

function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ── Seed LC data ──────────────────────────────────────────────────────────────
const LC_SEED = [
  {
    id: "lc1",
    lc_no: "LC-2026-001",
    issuing_bank: "Bank of Tokyo-Mitsubishi UFJ",
    applicant: "Yamamoto Trading Co., Ltd.",
    applicant_id: "c1",
    beneficiary: "PT. Mustikatama Graha Persada",
    amount_usd: 42500,
    currency: "USD",
    issue_date: addDays(-30),
    expiry_date: addDays(60),
    latest_shipment_date: addDays(45),
    port_loading: "Tanjung Priok, Jakarta",
    port_discharge: "Osaka, Japan",
    terms: "LC at Sight",
    so_id: "so3",
    shipment_id: "sh1",
    status: "Active",
    documents: [
      { name: "Bill of Lading", received: true },
      { name: "Commercial Invoice", received: true },
      { name: "Packing List", received: true },
      { name: "Certificate of Origin", received: true },
      { name: "SVLK Certificate", received: false },
      { name: "Phytosanitary Certificate", received: false },
    ],
    amendments: [],
    notes: "L/C No. YTC-2026-0891",
  },
  {
    id: "lc2",
    lc_no: "LC-2026-002",
    issuing_bank: "Emirates NBD Bank",
    applicant: "Al Futtaim Building Materials",
    applicant_id: "c3",
    beneficiary: "PT. Mustikatama Graha Persada",
    amount_usd: 32500,
    currency: "USD",
    issue_date: addDays(-10),
    expiry_date: addDays(30),
    latest_shipment_date: addDays(20),
    port_loading: "Tanjung Priok, Jakarta",
    port_discharge: "Jebel Ali, Dubai",
    terms: "Usance 60 days",
    so_id: "so2",
    shipment_id: "sh2",
    status: "Active",
    documents: [
      { name: "Bill of Lading", received: false },
      { name: "Commercial Invoice", received: false },
      { name: "Packing List", received: false },
      { name: "Certificate of Origin", received: false },
      { name: "SVLK Certificate", received: true },
      { name: "Phytosanitary Certificate", received: false },
    ],
    amendments: [
      { date: addDays(-5), description: "Extended latest shipment date by 10 days", newExpiry: addDays(30) },
    ],
    notes: "URGENT — expiring in 30 days",
  },
  {
    id: "lc3",
    lc_no: "LC-2026-003",
    issuing_bank: "Kookmin Bank (KB)",
    applicant: "SungJin Korea Trading Co.",
    applicant_id: "c4",
    beneficiary: "PT. Mustikatama Graha Persada",
    amount_usd: 48000,
    currency: "USD",
    issue_date: addDays(-100),
    expiry_date: addDays(-5),
    latest_shipment_date: addDays(-10),
    port_loading: "Tanjung Priok, Jakarta",
    port_discharge: "Busan, South Korea",
    terms: "LC at Sight",
    so_id: "so5",
    shipment_id: null,
    status: "Expired",
    documents: [
      { name: "Bill of Lading", received: false },
      { name: "Commercial Invoice", received: false },
      { name: "Packing List", received: false },
      { name: "Certificate of Origin", received: false },
      { name: "SVLK Certificate", received: true },
      { name: "Phytosanitary Certificate", received: false },
    ],
    amendments: [],
    notes: "EXPIRED — needs amendment or new LC",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function expiryColor(days) {
  if (days === null) return "text-gray-400";
  if (days < 0) return "text-red-700";
  if (days < 15) return "text-red-600";
  if (days < 30) return "text-amber-600";
  return "text-green-700";
}

function expiryBg(days) {
  if (days === null) return "bg-gray-100";
  if (days < 0) return "bg-red-100";
  if (days < 15) return "bg-red-50";
  if (days < 30) return "bg-amber-50";
  return "bg-green-50";
}

function statusColor(status) {
  switch (status) {
    case "Active":          return "bg-green-100 text-green-700";
    case "Expired":         return "bg-red-100 text-red-700";
    case "Utilized":        return "bg-blue-100 text-blue-700";
    case "Cancelled":       return "bg-gray-100 text-gray-500";
    case "Under Amendment": return "bg-amber-100 text-amber-700";
    default:                return "bg-gray-100 text-gray-500";
  }
}

// ── New LC Modal ──────────────────────────────────────────────────────────────
function NewLCModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    lc_no: "",
    issuing_bank: "",
    applicant: "",
    applicant_id: "",
    amount_usd: "",
    currency: "USD",
    issue_date: todayStr,
    expiry_date: "",
    latest_shipment_date: "",
    port_loading: "Tanjung Priok, Jakarta",
    port_discharge: "",
    terms: "LC at Sight",
    so_id: "",
    notes: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.lc_no.trim()) return toast("Nomor LC wajib diisi", "error");
    if (!form.applicant_id) return toast("Pilih buyer/applicant", "error");
    if (!form.amount_usd)   return toast("Masukkan jumlah LC (USD)", "error");
    if (!form.expiry_date)  return toast("Tanggal kadaluarsa wajib diisi", "error");

    onSave({
      id: `lc-${Date.now()}`,
      ...form,
      amount_usd: Number(form.amount_usd),
      status: "Active",
      documents: [
        { name: "Bill of Lading", received: false },
        { name: "Commercial Invoice", received: false },
        { name: "Packing List", received: false },
        { name: "Certificate of Origin", received: false },
        { name: "SVLK Certificate", received: false },
        { name: "Phytosanitary Certificate", received: false },
      ],
      amendments: [],
    });
    toast(`✅ LC ${form.lc_no} berhasil ditambahkan`, "success");
    onClose();
  };

  return (
    <Modal title="+ New Letter of Credit" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Nomor LC" required>
            <input className="erp-input w-full" placeholder="LC-2026-004" value={form.lc_no} onChange={e => set("lc_no", e.target.value)} />
          </FormField>
          <FormField label="Currency">
            <select className="erp-input w-full" value={form.currency} onChange={e => set("currency", e.target.value)}>
              <option>USD</option>
              <option>EUR</option>
              <option>JPY</option>
            </select>
          </FormField>
        </div>

        <FormField label="Issuing Bank" required>
          <input className="erp-input w-full" placeholder="Bank of Tokyo-Mitsubishi UFJ" value={form.issuing_bank} onChange={e => set("issuing_bank", e.target.value)} />
        </FormField>

        <FormField label="Applicant (Buyer)" required>
          <select className="erp-input w-full" value={form.applicant_id}
            onChange={e => {
              const c = CUSTOMERS.find(x => x.id === e.target.value);
              set("applicant_id", e.target.value);
              if (c) set("applicant", c.name);
            }}>
            <option value="">— Pilih Customer —</option>
            {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormField>

        <FormField label="Jumlah (USD)" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input type="number" className="erp-input w-full pl-7" placeholder="42500"
              value={form.amount_usd} onChange={e => set("amount_usd", e.target.value)} />
          </div>
        </FormField>

        <div className="grid grid-cols-3 gap-4">
          <FormField label="Tanggal Terbit">
            <input type="date" className="erp-input w-full" value={form.issue_date} onChange={e => set("issue_date", e.target.value)} />
          </FormField>
          <FormField label="Tanggal Kadaluarsa ⚠️" required>
            <input type="date" className="erp-input w-full border-amber-300" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
          </FormField>
          <FormField label="Latest Shipment Date ⚠️">
            <input type="date" className="erp-input w-full border-amber-300" value={form.latest_shipment_date} onChange={e => set("latest_shipment_date", e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Port of Loading">
            <input className="erp-input w-full" value={form.port_loading} onChange={e => set("port_loading", e.target.value)} />
          </FormField>
          <FormField label="Port of Discharge">
            <input className="erp-input w-full" placeholder="Osaka, Japan" value={form.port_discharge} onChange={e => set("port_discharge", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Terms">
          <select className="erp-input w-full" value={form.terms} onChange={e => set("terms", e.target.value)}>
            <option>LC at Sight</option>
            <option>Usance 30 days</option>
            <option>Usance 60 days</option>
            <option>Usance 90 days</option>
            <option>Usance 120 days</option>
          </select>
        </FormField>

        <FormField label="Linked Sales Order">
          <select className="erp-input w-full" value={form.so_id} onChange={e => set("so_id", e.target.value)}>
            <option value="">— Opsional —</option>
            {SALES_ORDERS.map(so => <option key={so.id} value={so.id}>{so.so_no}</option>)}
          </select>
        </FormField>

        <FormField label="Notes">
          <textarea className="erp-input w-full" rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan LC</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── LC Detail Modal ───────────────────────────────────────────────────────────
function LCDetailModal({ lc, onClose, onUpdate }) {
  const [docs, setDocs] = useState(lc.documents || []);
  const [amendments, setAmendments] = useState(lc.amendments || []);
  const [showAmendForm, setShowAmendForm] = useState(false);
  const [amendForm, setAmendForm] = useState({ date: todayStr, description: "", newExpiry: lc.expiry_date });

  const daysLeft = daysFrom(lc.expiry_date);
  const shipDaysLeft = daysFrom(lc.latest_shipment_date);
  const so = SALES_ORDERS.find(s => s.id === lc.so_id);
  const shipment = SHIPMENTS.find(s => s.id === lc.shipment_id);
  const docsReceived = docs.filter(d => d.received).length;

  const toggleDoc = (i) => {
    setDocs(prev => prev.map((d, idx) => idx === i ? { ...d, received: !d.received } : d));
  };

  const addAmendment = () => {
    if (!amendForm.description.trim()) return toast("Deskripsi amandemen wajib diisi", "error");
    const newAmend = { ...amendForm };
    setAmendments(prev => [...prev, newAmend]);
    setShowAmendForm(false);
    toast("✅ Amandemen ditambahkan", "success");
  };

  const markUtilized = () => {
    onUpdate(lc.id, { status: "Utilized" });
    toast(`✅ LC ${lc.lc_no} ditandai sebagai Utilized`, "success");
    onClose();
  };

  return (
    <Modal title={`LC Detail — ${lc.lc_no}`} onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-5 overflow-y-auto max-h-[85vh]">
        {/* Header KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl text-center ${expiryBg(daysLeft)}`}>
            <p className="text-xs text-gray-500 mb-1">Expiry Countdown</p>
            <p className={`text-2xl font-black ${expiryColor(daysLeft)}`}>
              {daysLeft === null ? "—" : daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`}
            </p>
            <p className="text-xs text-gray-500 mt-1">{DATE(lc.expiry_date)}</p>
          </div>
          <div className="p-3 rounded-xl text-center bg-blue-50">
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="text-2xl font-black text-blue-700">${lc.amount_usd?.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">{lc.terms}</p>
          </div>
          <div className={`p-3 rounded-xl text-center ${expiryBg(shipDaysLeft)}`}>
            <p className="text-xs text-gray-500 mb-1">Latest Shipment</p>
            <p className={`text-2xl font-black ${expiryColor(shipDaysLeft)}`}>
              {shipDaysLeft === null ? "—" : shipDaysLeft < 0 ? "MISSED" : `${shipDaysLeft}d`}
            </p>
            <p className="text-xs text-gray-500 mt-1">{DATE(lc.latest_shipment_date)}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${statusColor(lc.status)}`}>{lc.status}</span>
          {lc.status === "Active" && (
            <Btn variant="success" size="xs" onClick={markUtilized}>✅ Mark as Utilized</Btn>
          )}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Issuing Bank", lc.issuing_bank],
            ["Applicant", lc.applicant],
            ["Beneficiary", lc.beneficiary],
            ["Issue Date", DATE(lc.issue_date)],
            ["Port of Loading", lc.port_loading],
            ["Port of Discharge", lc.port_discharge],
            ["Linked SO", so ? so.so_no : "—"],
            ["Linked Shipment", shipment ? shipment.shipment_no : "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-400 mb-0.5">{k}</p>
              <p className="font-medium text-gray-800">{v}</p>
            </div>
          ))}
        </div>

        {lc.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
            📝 {lc.notes}
          </div>
        )}

        {/* Document checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800 text-sm">Dokumen LC ({docsReceived}/{docs.length})</p>
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(docsReceived / docs.length) * 100}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            {docs.map((doc, i) => (
              <label key={doc.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer border border-gray-100">
                <input
                  type="checkbox"
                  checked={doc.received}
                  onChange={() => toggleDoc(i)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                <span className={`text-sm font-medium flex-1 ${doc.received ? "text-green-700 line-through" : "text-gray-700"}`}>
                  {doc.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doc.received ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {doc.received ? "✓ Diterima" : "Pending"}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Amendment log */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-gray-800 text-sm">Riwayat Amandemen ({amendments.length})</p>
            <Btn variant="secondary" size="xs" onClick={() => setShowAmendForm(!showAmendForm)}>
              {showAmendForm ? "Batal" : "+ Add Amendment"}
            </Btn>
          </div>
          {showAmendForm && (
            <div className="p-3 border border-amber-200 rounded-xl bg-amber-50 space-y-2 mb-3">
              <div className="grid grid-cols-2 gap-2">
                <FormField label="Tanggal">
                  <input type="date" className="erp-input w-full" value={amendForm.date}
                    onChange={e => setAmendForm(f => ({ ...f, date: e.target.value }))} />
                </FormField>
                <FormField label="New Expiry Date">
                  <input type="date" className="erp-input w-full" value={amendForm.newExpiry}
                    onChange={e => setAmendForm(f => ({ ...f, newExpiry: e.target.value }))} />
                </FormField>
              </div>
              <FormField label="Deskripsi">
                <input className="erp-input w-full" placeholder="Extended expiry by 30 days…"
                  value={amendForm.description}
                  onChange={e => setAmendForm(f => ({ ...f, description: e.target.value }))} />
              </FormField>
              <div className="flex justify-end">
                <Btn size="xs" onClick={addAmendment}>💾 Simpan</Btn>
              </div>
            </div>
          )}
          {amendments.length === 0 && (
            <p className="text-sm text-gray-400 italic">Belum ada amandemen</p>
          )}
          <div className="space-y-2">
            {amendments.map((a, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-gray-500">{DATE(a.date)}</span>
                  {a.newExpiry && (
                    <span className="text-xs text-amber-700 font-medium">New expiry: {DATE(a.newExpiry)}</span>
                  )}
                </div>
                <p className="text-gray-700">{a.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Main LC Page ──────────────────────────────────────────────────────────────
export default function LC() {
  const [lcs, setLCs] = useState(LC_SEED);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");

  const FX = 15560;

  const enriched = lcs.map(lc => ({
    ...lc,
    daysLeft: daysFrom(lc.expiry_date),
    shipDaysLeft: daysFrom(lc.latest_shipment_date),
  }));

  const filtered = statusFilter === "All"
    ? enriched
    : enriched.filter(l => l.status === statusFilter);

  // KPIs
  const active    = enriched.filter(l => l.status === "Active");
  const expiring  = active.filter(l => l.daysLeft !== null && l.daysLeft <= 30);
  const utilized  = enriched.filter(l => l.status === "Utilized");
  const expired   = enriched.filter(l => l.status === "Expired");

  const totalActiveUSD = active.reduce((s, l) => s + l.amount_usd, 0);
  const urgentExpiring = enriched.filter(l => l.daysLeft !== null && l.daysLeft < 14 && l.status === "Active");

  const handleUpdate = (id, changes) => {
    setLCs(prev => prev.map(l => l.id === id ? { ...l, ...changes } : l));
  };

  const STATUSES = ["All", "Active", "Expired", "Utilized", "Cancelled", "Under Amendment"];

  return (
    <div>
      <PageHeader
        title="LC Tracker"
        subtitle="Letter of Credit Management — Ekspor Kayu"
        actions={<Btn onClick={() => setShowNew(true)}>🏦 + New LC</Btn>}
      />

      {/* Urgent alert banner */}
      {urgentExpiring.length > 0 && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-300 rounded-xl text-sm text-red-700">
          <span className="text-xl flex-shrink-0">🚨</span>
          <div>
            <p className="font-bold">Perhatian: {urgentExpiring.length} LC akan kadaluarsa dalam 14 hari!</p>
            {urgentExpiring.map(l => (
              <p key={l.id} className="text-xs mt-0.5">
                {l.lc_no} · {l.applicant} · {l.daysLeft <= 0 ? "EXPIRED" : `${l.daysLeft} hari lagi`} ({DATE(l.expiry_date)})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="Active LCs"
          sublabel={`Total $${totalActiveUSD.toLocaleString()}`}
          value={active.length}
          icon="🏦"
          color="text-blue-700"
        />
        <KPICard
          label="Expiring ≤30 hari"
          sublabel="Perlu perhatian"
          value={expiring.length}
          icon="⏰"
          color={expiring.length > 0 ? "text-amber-700" : "text-gray-500"}
        />
        <KPICard
          label="Utilized"
          sublabel="LC lunas/digunakan"
          value={utilized.length}
          icon="✅"
          color="text-green-700"
        />
        <KPICard
          label="Expired / Need Amendment"
          sublabel="Segera tindaklanjuti"
          value={expired.length}
          icon="⚠️"
          color={expired.length > 0 ? "text-red-700" : "text-gray-500"}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex gap-1.5 flex-wrap mb-4">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}>
              {s}
              <span className="ml-1 opacity-60">
                {s === "All" ? enriched.length : enriched.filter(l => l.status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* LC List */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <div className="text-4xl mb-2">🏦</div>
              <p className="font-medium">Tidak ada LC ditemukan</p>
            </div>
          )}
          {filtered.map(lc => {
            const daysLeft = lc.daysLeft;
            const docsDone = (lc.documents || []).filter(d => d.received).length;
            const docsTot  = (lc.documents || []).length;
            return (
              <div
                key={lc.id}
                onClick={() => setSelected(lc)}
                className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono font-black text-blue-700 text-sm">{lc.lc_no}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor(lc.status)}`}>{lc.status}</span>
                      {daysLeft !== null && daysLeft < 14 && daysLeft >= 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">🔴 Segera!</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm truncate">{lc.applicant}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{lc.issuing_bank} · {lc.terms}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{lc.port_loading} → {lc.port_discharge}</p>
                  </div>

                  <div className="flex-shrink-0 text-right space-y-1">
                    <p className="text-lg font-black text-gray-900">${lc.amount_usd?.toLocaleString()}</p>
                    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${expiryBg(daysLeft)} ${expiryColor(daysLeft)}`}>
                      {daysLeft === null ? "—" :
                       daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` :
                       daysLeft === 0 ? "Expires today!" :
                       `Expires in ${daysLeft}d`}
                    </div>
                    <div className="text-xs text-gray-400">
                      Docs: {docsDone}/{docsTot}
                      <span className="inline-block w-12 bg-gray-200 rounded-full h-1 ml-1 align-middle">
                        <span className="block bg-green-500 h-1 rounded-full" style={{ width: `${docsTot ? (docsDone/docsTot)*100 : 0}%` }} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detail Modal */}
      {selected && (
        <LCDetailModal
          lc={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* New LC Modal */}
      {showNew && (
        <NewLCModal
          onClose={() => setShowNew(false)}
          onSave={lc => setLCs(prev => [lc, ...prev])}
        />
      )}
    </div>
  );
}
