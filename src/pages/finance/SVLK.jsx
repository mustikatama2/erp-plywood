import { useState } from "react";
import { PageHeader, Card, KPICard, Btn, Badge, Modal, FormField, toast } from "../../components/ui";
import { DATE } from "../../lib/fmt";
import { SHIPMENTS } from "../../data/seed";

// ── Seed data ────────────────────────────────────────────────────────────────
const INITIAL_CERTS = [
  {
    id: "sv1",
    cert_type: "ETPIK",
    cert_no: "ETPIK-031.IX.2024-0234",
    issuer: "Kementerian Perdagangan RI",
    issue_date: "2024-09-15",
    expiry_date: "2026-09-14",
    scope: "Plywood, Blockboard, Veneer",
    status: "Active",
    linked_shipments: ["sh1", "sh2"],
  },
  {
    id: "sv2",
    cert_type: "S-LK",
    cert_no: "SLK-IDN-0891-2025",
    issuer: "LPVI (Lembaga Penilai & Verifikasi Independen)",
    issue_date: "2025-03-01",
    expiry_date: "2026-02-28",
    scope: "Full supply chain — Meranti, Sengon, Pine",
    status: "Expired",
    linked_shipments: [],
  },
  {
    id: "sv3",
    cert_type: "CoC",
    cert_no: "CoC-FSC-IDN-2025-0045",
    issuer: "FSC International",
    issue_date: "2025-01-10",
    expiry_date: "2027-01-09",
    scope: "FSC Chain of Custody — certified timber sourcing",
    status: "Active",
    linked_shipments: ["sh1"],
  },
];

const CERT_TYPES = ["ETPIK", "S-LK", "V-Legal", "CoC"];

function daysUntilExpiry(expiryDate) {
  return Math.round((new Date(expiryDate) - new Date()) / 86400000);
}

function expiryColor(days) {
  if (days < 0) return "text-red-700 bg-red-50";
  if (days <= 30) return "text-red-700 bg-red-50";
  if (days <= 90) return "text-amber-700 bg-amber-50";
  return "text-green-700 bg-green-50";
}

function expiryBadge(days) {
  if (days < 0) return { label: `Kadaluarsa ${Math.abs(days)} hari lalu`, color: "bg-red-100 text-red-700" };
  if (days === 0) return { label: "Kadaluarsa hari ini!", color: "bg-red-100 text-red-700" };
  if (days <= 30) return { label: `${days} hari lagi ⚠️`, color: "bg-red-100 text-red-700" };
  if (days <= 90) return { label: `${days} hari lagi`, color: "bg-amber-100 text-amber-700" };
  return { label: `${days} hari lagi`, color: "bg-green-100 text-green-700" };
}

function CertTypeBadge({ type }) {
  const colors = {
    ETPIK:   "bg-blue-100 text-blue-700",
    "S-LK":  "bg-purple-100 text-purple-700",
    "V-Legal": "bg-teal-100 text-teal-700",
    CoC:     "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${colors[type] || "bg-gray-100 text-gray-700"}`}>
      {type}
    </span>
  );
}

function NewCertModal({ onClose, onSave }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    cert_type: "ETPIK",
    cert_no: "",
    issuer: "",
    issue_date: today,
    expiry_date: "",
    scope: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.cert_no.trim()) return toast("Nomor sertifikat wajib diisi", "error");
    if (!form.issuer.trim()) return toast("Nama penerbit wajib diisi", "error");
    if (!form.expiry_date) return toast("Tanggal kadaluarsa wajib diisi", "error");

    const days = daysUntilExpiry(form.expiry_date);
    onSave({
      id: `sv-${Date.now()}`,
      ...form,
      status: days < 0 ? "Expired" : "Active",
      linked_shipments: [],
    });
    toast(`✅ Sertifikat ${form.cert_no} berhasil ditambahkan`, "success");
    onClose();
  };

  return (
    <Modal title="Tambah Sertifikat SVLK Baru" onClose={onClose} width="max-w-lg">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Jenis Sertifikat">
            <select className="erp-input w-full" value={form.cert_type} onChange={e => set("cert_type", e.target.value)}>
              {CERT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Nomor Sertifikat" required>
            <input className="erp-input w-full font-mono" value={form.cert_no} onChange={e => set("cert_no", e.target.value)} placeholder="e.g. ETPIK-031.IX.2024-0235" />
          </FormField>
        </div>
        <FormField label="Diterbitkan Oleh" required>
          <input className="erp-input w-full" value={form.issuer} onChange={e => set("issuer", e.target.value)} placeholder="Nama lembaga penerbit…" />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tanggal Terbit">
            <input type="date" className="erp-input w-full" value={form.issue_date} onChange={e => set("issue_date", e.target.value)} />
          </FormField>
          <FormField label="Tanggal Kadaluarsa" required>
            <input type="date" className="erp-input w-full" value={form.expiry_date} onChange={e => set("expiry_date", e.target.value)} />
          </FormField>
        </div>
        <FormField label="Ruang Lingkup (Scope)">
          <textarea className="erp-input w-full" rows={2} value={form.scope} onChange={e => set("scope", e.target.value)} placeholder="Produk / rantai pasok yang dicakup…" />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan Sertifikat</Btn>
        </div>
      </div>
    </Modal>
  );
}

function RenewModal({ cert, onClose, onRenew }) {
  const today = new Date().toISOString().split("T")[0];
  const [newExpiry, setNewExpiry] = useState("");
  const [newCertNo, setNewCertNo] = useState(cert.cert_no + " (pembaruan)");

  const handleRenew = () => {
    if (!newExpiry) return toast("Tanggal kadaluarsa baru wajib diisi", "error");
    onRenew(cert.id, { expiry_date: newExpiry, cert_no: newCertNo, status: "Active" });
    toast(`✅ Sertifikat ${cert.cert_no} berhasil diperbarui`, "success");
    onClose();
  };

  return (
    <Modal title="Perbarui Sertifikat" onClose={onClose} width="max-w-md">
      <div className="p-5 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <p className="text-xs text-gray-500 mb-1">Sertifikat</p>
          <p className="font-bold font-mono text-amber-700">{cert.cert_no}</p>
          <p className="text-gray-600 text-xs">{cert.cert_type} · {cert.issuer}</p>
        </div>
        <FormField label="Nomor Sertifikat Baru">
          <input className="erp-input w-full font-mono" value={newCertNo} onChange={e => setNewCertNo(e.target.value)} />
        </FormField>
        <FormField label="Tanggal Kadaluarsa Baru" required>
          <input type="date" className="erp-input w-full" value={newExpiry} min={today} onChange={e => setNewExpiry(e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn variant="solid_green" onClick={handleRenew}>🔄 Perbarui</Btn>
        </div>
      </div>
    </Modal>
  );
}

function CertDetailModal({ cert, shipments, onClose, onRenew }) {
  const [showRenew, setShowRenew] = useState(false);
  const days = daysUntilExpiry(cert.expiry_date);
  const badge = expiryBadge(days);
  const linked = shipments.filter(s => cert.linked_shipments.includes(s.id));

  return (
    <>
      <Modal title={cert.cert_no} subtitle={cert.cert_type} onClose={onClose} width="max-w-lg">
        <div className="p-5 space-y-4">
          {/* Status banner */}
          <div className={`rounded-lg p-3 ${days < 0 ? "bg-red-50 border border-red-200" : days <= 90 ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"}`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm ${days < 0 ? "text-red-700" : days <= 90 ? "text-amber-700" : "text-green-700"}`}>
                {days < 0 ? "❌ Sertifikat Kadaluarsa" : days <= 30 ? "🔴 Segera Kadaluarsa" : days <= 90 ? "⚠️ Akan Kadaluarsa" : "✅ Sertifikat Aktif"}
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ["Jenis", <CertTypeBadge type={cert.cert_type} />],
              ["Penerbit", cert.issuer],
              ["Terbit", DATE(cert.issue_date)],
              ["Kadaluarsa", DATE(cert.expiry_date)],
              ["Status", <Badge status={cert.status} />],
              ["Ruang Lingkup", cert.scope],
            ].map(([k, v]) => (
              <div key={k} className={k === "Ruang Lingkup" || k === "Penerbit" ? "col-span-2" : ""}>
                <p className="text-xs text-gray-500 mb-0.5">{k}</p>
                <p className="font-medium text-gray-900">{v}</p>
              </div>
            ))}
          </div>

          {/* Countdown dial */}
          <div className={`rounded-xl p-4 text-center ${expiryColor(days)}`}>
            <p className="text-3xl font-black">{days < 0 ? Math.abs(days) : days}</p>
            <p className="text-sm font-medium">{days < 0 ? "hari sejak kadaluarsa" : "hari hingga kadaluarsa"}</p>
          </div>

          {/* Linked shipments */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">
              Pengiriman Tertaut ({linked.length})
            </p>
            {linked.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Belum ada pengiriman tertaut</p>
            ) : (
              <div className="space-y-1.5">
                {linked.map(s => (
                  <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-mono font-bold text-blue-700">{s.bl_no}</span>
                      <span className="text-gray-500 text-xs ml-2">{s.port_discharge}</span>
                    </div>
                    <Badge status={s.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between gap-2 pt-2 border-t border-gray-100">
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={() => toast("📤 Fitur upload dokumen akan segera tersedia", "info")}>
                📤 Upload Sertifikat
              </Btn>
              <Btn variant="secondary" size="sm" onClick={() => setShowRenew(true)}>
                🔄 Perbarui Sertifikat
              </Btn>
            </div>
            <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
          </div>
        </div>
      </Modal>

      {showRenew && (
        <RenewModal
          cert={cert}
          onClose={() => setShowRenew(false)}
          onRenew={(id, changes) => {
            onRenew(id, changes);
            setShowRenew(false);
            onClose();
          }}
        />
      )}
    </>
  );
}

export default function SVLK() {
  const [certs, setCerts] = useState(INITIAL_CERTS);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const enriched = certs.map(c => ({
    ...c,
    days: daysUntilExpiry(c.expiry_date),
  }));

  // KPIs
  const active = enriched.filter(c => c.status === "Active").length;
  const expiring90 = enriched.filter(c => c.status === "Active" && c.days >= 0 && c.days <= 90).length;
  const expired = enriched.filter(c => c.status === "Expired" || c.days < 0).length;
  const linkedShipCount = [...new Set(certs.flatMap(c => c.linked_shipments))].length;

  // Alert banners
  const hasExpired = expired > 0;
  const hasExpiring = expiring90 > 0;

  // Shipment checklist: for each shipment, which certs are attached?
  const allShipments = SHIPMENTS || [];
  const shipmentChecklist = allShipments.map(s => ({
    ...s,
    attachedCerts: certs.filter(c => c.linked_shipments.includes(s.id) && c.status === "Active"),
    hasSVLK: certs.some(c => c.linked_shipments.includes(s.id) && c.status === "Active"),
  }));

  const handleRenew = (id, changes) => {
    setCerts(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  };

  return (
    <div>
      <PageHeader
        title="SVLK Certificate Tracker"
        subtitle="Sistem Verifikasi Legalitas dan Kelestarian Kayu — wajib untuk ekspor"
        actions={
          <Btn onClick={() => setShowNew(true)}>+ Sertifikat Baru</Btn>
        }
      />

      {/* Alert banners */}
      {(hasExpired || hasExpiring) && (
        <div className="space-y-2 mb-5">
          {hasExpired && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">❌</span>
                <div>
                  <p className="text-sm font-bold text-red-700">Sertifikat SVLK Kadaluarsa!</p>
                  <p className="text-xs text-red-600">{expired} sertifikat perlu segera diperbaharui agar pengiriman ekspor tidak terhambat.</p>
                </div>
              </div>
            </div>
          )}
          {hasExpiring && !hasExpired && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-amber-700">Sertifikat Akan Segera Kadaluarsa</p>
                  <p className="text-xs text-amber-600">{expiring90} sertifikat akan kadaluarsa dalam 90 hari. Segera jadwalkan pembaruan.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Sertifikat Aktif" sublabel="Active Certificates" value={active} icon="📜" color="text-green-700" />
        <KPICard label="Akan Kadaluarsa" sublabel="Expiring in 90 days" value={expiring90} icon="⚠️" color="text-amber-700" sub={expiring90 > 0 ? "Perlu perhatian" : "Semua aman"} />
        <KPICard label="Perlu Diperbaharui" sublabel="Expired / Renewal Needed" value={expired} icon="❌" color={expired > 0 ? "text-red-700" : "text-gray-500"} />
        <KPICard label="Pengiriman Terhubung" sublabel="Linked Shipments" value={linkedShipCount} icon="🚢" color="text-blue-700" />
      </div>

      {/* Certificate list */}
      <Card title="Daftar Sertifikat SVLK" subtitle={`${certs.length} sertifikat terdaftar`}>
        <div className="space-y-2">
          {enriched.map(cert => {
            const badge = expiryBadge(cert.days);
            return (
              <button key={cert.id} onClick={() => setSelected(cert)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all group text-left">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📜</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CertTypeBadge type={cert.cert_type} />
                      <span className="font-mono font-bold text-sm text-gray-900">{cert.cert_no}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{cert.issuer}</p>
                    <p className="text-xs text-gray-400">{cert.scope}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge status={cert.status} />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {cert.linked_shipments.length} pengiriman
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Shipment SVLK Checklist */}
      <div className="mt-5">
        <Card title="Checklist SVLK per Pengiriman" subtitle="Status kelengkapan dokumen SVLK tiap pengiriman">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">B/L No.</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Tujuan</th>
                  <th className="text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">Sertifikat Aktif Tertaut</th>
                  <th className="text-center py-2.5 px-3 text-xs font-bold text-gray-500 uppercase">SVLK OK?</th>
                </tr>
              </thead>
              <tbody>
                {shipmentChecklist.slice(0, 6).map(s => (
                  <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{s.bl_no}</td>
                    <td className="py-2.5 px-3 text-gray-700">{s.port_discharge}</td>
                    <td className="py-2.5 px-3">
                      {s.attachedCerts.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">Tidak ada</span>
                      ) : (
                        <div className="flex gap-1 flex-wrap">
                          {s.attachedCerts.map(c => <CertTypeBadge key={c.id} type={c.cert_type} />)}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {s.hasSVLK ? (
                        <span className="text-green-700 font-bold text-base">✅</span>
                      ) : (
                        <span className="text-red-700 font-bold text-base">❌</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {selected && (
        <CertDetailModal
          cert={selected}
          shipments={SHIPMENTS || []}
          onClose={() => setSelected(null)}
          onRenew={handleRenew}
        />
      )}
      {showNew && (
        <NewCertModal
          onClose={() => setShowNew(false)}
          onSave={cert => setCerts(prev => [cert, ...prev])}
        />
      )}
    </div>
  );
}
