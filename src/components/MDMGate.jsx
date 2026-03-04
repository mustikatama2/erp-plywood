/**
 * MDMGate — role-aware create/edit buttons + status badges for master data pages
 *
 * Usage:
 *   <MDMAddButton type="customer" onSuccess={refresh} fields={[...]} />
 *   <MDMStatusBadge record={row} />
 *   <MDMRowActions record={row} type="customer" onDeactivate={...} />
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Btn, toast } from "./ui";
import { useMDM } from "../contexts/MDMContext";
import { useAuth } from "../contexts/AuthContext";
import { canSubmitMDM, canApproveMDM, canDeactivate, MDM_TYPES } from "../lib/mdm";

// ── Status Badge ──────────────────────────────────────────────────────────────

export function MDMStatusBadge({ record }) {
  const status = record?._mdmStatus;
  if (!status || status === "active") return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${
      status === "pending"  ? "bg-amber-500/15 border-amber-500/30 text-amber-300" :
      status === "inactive" ? "bg-gray-500/15 border-gray-500/30 text-gray-400" :
      "bg-red-500/15 border-red-500/30 text-red-300"
    }`}>
      {status === "pending" ? "⏳ Menunggu" : status === "inactive" ? "⊘ Nonaktif" : "✕ Ditolak"}
    </span>
  );
}

// ── Add / Submit button ───────────────────────────────────────────────────────

export function MDMAddButton({ type, fields, defaults = {}, onSuccess, extraInfo }) {
  const { user } = useAuth();
  const { submitMDM, addDirectly } = useMDM();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);

  const isAdmin  = canApproveMDM(user?.role);
  const canSubmit= canSubmitMDM(user?.role, type);
  const typeMeta = MDM_TYPES[type];

  if (!canSubmit) return null; // no permission → don't show the button

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    const required = fields.filter(f => f.required);
    for (const f of required) {
      if (!form[f.key]) { toast(`"${f.label}" wajib diisi`, "error"); return; }
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));

    const data = {
      ...form,
      id: `${type}_${Date.now()}`,
      created_at: new Date().toISOString(),
      mdm_status: isAdmin ? "active" : "pending",
    };

    if (isAdmin) {
      addDirectly(type, data, user);
      toast(`✅ ${typeMeta.label} berhasil ditambahkan`);
    } else {
      submitMDM(type, data, user);
      toast(`📤 Pengajuan terkirim. Admin akan meninjau dan menyetujui.`);
    }

    setSaving(false);
    setForm(defaults);
    setOpen(false);
    onSuccess?.();
  };

  return (
    <>
      <Btn onClick={() => { setForm(defaults); setOpen(true); }}>
        {isAdmin ? `+ Tambah ${typeMeta.label}` : `📤 Ajukan ${typeMeta.label} Baru`}
      </Btn>

      {open && (
        <Modal
          title={isAdmin ? `Tambah ${typeMeta.label}` : `Ajukan ${typeMeta.label} Baru`}
          subtitle={isAdmin ? "Langsung aktif setelah disimpan" : "Akan ditinjau admin sebelum aktif"}
          onClose={() => setOpen(false)}
        >
          <div className="p-5 space-y-4">
            {/* Non-admin info banner */}
            {!isAdmin && (
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm">
                <span className="text-xl flex-shrink-0">⏳</span>
                <div>
                  <p className="font-bold text-amber-300">Memerlukan Persetujuan Admin</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pengajuan Anda akan masuk ke antrian MDM. Data tidak akan aktif sampai admin menyetujuinya.
                    {" "}<button onClick={() => navigate("/admin/mdm")} className="text-blue-400 hover:underline">Lihat antrian</button>
                  </p>
                </div>
              </div>
            )}

            {extraInfo && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300">
                {extraInfo}
              </div>
            )}

            {/* Dynamic form fields */}
            <div className="space-y-3">
              {fields.map(field => (
                <div key={field.key}>
                  <label className="erp-label">
                    {field.label} {field.bi && <span className="text-gray-600">({field.bi})</span>}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {field.type === "select" ? (
                    <select value={form[field.key] || ""} onChange={set(field.key)} className="erp-input">
                      <option value="">-- Pilih --</option>
                      {field.options?.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea value={form[field.key] || ""} onChange={set(field.key)} rows={3} className="erp-input resize-none" placeholder={field.placeholder} />
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={form[field.key] || ""}
                      onChange={set(field.key)}
                      className="erp-input"
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.hint && <p className="text-xs text-gray-600 mt-0.5">{field.hint}</p>}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
              <Btn variant="secondary" onClick={() => setOpen(false)}>Batal</Btn>
              <Btn onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan…" : isAdmin ? "💾 Simpan" : "📤 Kirim Pengajuan"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ── Row actions: deactivate button ────────────────────────────────────────────

export function MDMDeactivateButton({ record, type, onDeactivate }) {
  const { user } = useAuth();
  const { deactivateMDM } = useMDM();
  const [confirm, setConfirm] = useState(false);

  if (!canDeactivate(user?.role, type)) return null;
  if (record?._mdmStatus === "inactive") return null;
  if (!record?._mdmId) return null; // seed data — can't deactivate from UI yet

  if (!confirm) {
    return (
      <Btn size="xs" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setConfirm(true)}>
        Nonaktifkan
      </Btn>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-red-400">Yakin?</span>
      <Btn size="xs" variant="danger" onClick={() => {
        deactivateMDM(record._mdmId);
        toast("Record dinonaktifkan", "error");
        onDeactivate?.();
        setConfirm(false);
      }}>Ya</Btn>
      <Btn size="xs" variant="ghost" onClick={() => setConfirm(false)}>Tidak</Btn>
    </div>
  );
}

// ── MDM-aware quick approve from within a list ────────────────────────────────

export function MDMApproveInline({ record, onApproved }) {
  const { user } = useAuth();
  const { approveMDM } = useMDM();

  if (record?._mdmStatus !== "pending") return null;
  if (!canApproveMDM(user?.role)) return null;

  return (
    <Btn size="xs" variant="success" onClick={(e) => {
      e.stopPropagation();
      approveMDM(record._mdmId, user);
      toast(`✅ ${record.name || "Record"} disetujui dan aktif`);
      onApproved?.();
    }}>
      ✅ Setujui
    </Btn>
  );
}

// ── Pending badge for nav / tabs ─────────────────────────────────────────────

export function MDMPendingBadge({ type }) {
  const { pendingByType } = useMDM();
  const count = type ? pendingByType(type) : 0;
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-black bg-amber-500 text-black rounded-full">
      {count > 9 ? "9+" : count}
    </span>
  );
}
