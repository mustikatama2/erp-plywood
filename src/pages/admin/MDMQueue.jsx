import { useState } from "react";
import { PageHeader, Card, Btn, Modal, toast } from "../../components/ui";
import { useMDM } from "../../contexts/MDMContext";
import { useAuth } from "../../contexts/AuthContext";
import { MDM_TYPES, MDM_STATUS } from "../../lib/mdm";
import { DATE } from "../../lib/fmt";

const FILTERS = ["all", "pending", "approved", "rejected"];

function DataPreview({ data }) {
  if (!data) return null;
  const skip = ["mdm_status", "_mdmId", "_mdmStatus", "_mdmBy", "_mdmAt", "id"];
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {Object.entries(data)
        .filter(([k]) => !skip.includes(k))
        .map(([k, v]) => (
          <div key={k}>
            <span className="text-xs text-gray-500 uppercase tracking-wide block">{k.replace(/_/g, " ")}</span>
            <span className="text-gray-900 font-medium">{String(v ?? "—")}</span>
          </div>
        ))}
    </div>
  );
}

function RejectModal({ entry, onReject, onClose }) {
  const [reason, setReason] = useState("");
  return (
    <Modal title="Tolak Pengajuan" subtitle={`${MDM_TYPES[entry.type]?.label} — ${entry.data?.name || entry.data?.inv_no}`} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div>
          <label className="erp-label">Alasan Penolakan <span className="text-red-700">*</span></label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            rows={3} className="erp-input resize-none"
            placeholder="Contoh: Data duplikat dengan pelanggan yang sudah ada. Silakan cek PT. Kayu Jaya Sentosa…" />
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn variant="danger" disabled={!reason.trim()} onClick={() => { onReject(reason); onClose(); }}>
            Tolak Pengajuan
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function MDMQueue() {
  const { queue, approveMDM, rejectMDM, pendingCount } = useMDM();
  const { user } = useAuth();
  const [filter,   setFilter]   = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [preview,  setPreview]  = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const filtered = queue
    .filter(e => filter === "all" || e.status === filter)
    .filter(e => typeFilter === "all" || e.type === typeFilter)
    .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  const handleApprove = (id, name) => {
    approveMDM(id, user);
    toast(`✅ ${name} disetujui dan kini aktif`);
    if (preview?.id === id) setPreview(null);
  };

  const handleReject = (id, reason) => {
    rejectMDM(id, user, reason);
    toast("Pengajuan ditolak. Pemohon akan melihat alasan.", "error");
  };

  return (
    <div>
      <PageHeader
        title="Antrian Master Data (MDM)"
        subtitle="Tinjau dan setujui pengajuan data induk baru"
        actions={
          pendingCount > 0 && (
            <span className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-700 text-sm font-bold px-3 py-1.5 rounded-full">
              ⏳ {pendingCount} menunggu persetujuan
            </span>
          )
        }
      />

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded font-medium capitalize transition-colors ${filter === f ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-800"}`}>
              {f === "all" ? "Semua" : f === "pending" ? `Menunggu ${pendingCount > 0 ? `(${pendingCount})` : ""}` : f === "approved" ? "Disetujui" : "Ditolak"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          <button onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${typeFilter === "all" ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-800"}`}>
            Semua Tipe
          </button>
          {Object.entries(MDM_TYPES).map(([k, v]) => (
            <button key={k} onClick={() => setTypeFilter(k)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${typeFilter === k ? "bg-gray-200 text-gray-900" : "text-gray-400 hover:text-gray-800"}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
            <span className="text-4xl">{filter === "pending" ? "✅" : "📭"}</span>
            <p className="font-bold text-gray-900">
              {filter === "pending" ? "Tidak ada pengajuan yang menunggu" : "Tidak ada data"}
            </p>
            <p className="text-sm">{filter === "pending" ? "Semua data induk sudah diproses" : "Coba ubah filter"}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => {
            const type = MDM_TYPES[entry.type];
            const status = MDM_STATUS[entry.status];
            const name = entry.data?.name || entry.data?.code || entry.data?.account_name || entry.id.slice(-6);

            return (
              <div key={entry.id}
                className={`border rounded-xl overflow-hidden transition-all ${
                  entry.status === "pending"
                    ? "border-amber-500/30 bg-amber-500/5"
                    : entry.status === "approved"
                    ? "border-green-500/20 bg-green-500/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}>
                <div className="flex items-start gap-4 p-4">
                  {/* Type icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {type?.icon}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider ${type?.color}`}>{type?.label}</span>
                        <h3 className="text-base font-black text-gray-900 mt-0.5">{name}</h3>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${status?.bg} ${status?.color}`}>
                        {entry.status === "pending" ? "⏳ Menunggu" : entry.status === "approved" ? "✅ Disetujui" : "❌ Ditolak"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-gray-400">
                      <span>Diajukan oleh <strong className="text-gray-700">{entry.requestedBy?.name}</strong> ({entry.requestedBy?.role})</span>
                      <span>{DATE(entry.requestedAt)}</span>
                      {entry.processedBy && (
                        <span>
                          {entry.status === "approved" ? "Disetujui" : "Ditolak"} oleh <strong className="text-gray-700">{entry.processedBy.name}</strong> · {DATE(entry.processedAt)}
                        </span>
                      )}
                    </div>

                    {entry.rejectionReason && (
                      <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                        <strong>Alasan penolakan:</strong> {entry.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    <Btn size="xs" variant="ghost" onClick={() => setPreview(entry)}>
                      👁 Preview
                    </Btn>
                    {entry.status === "pending" && (
                      <>
                        <Btn size="xs" variant="success"
                          onClick={() => handleApprove(entry.id, name)}>
                          ✅ Setujui
                        </Btn>
                        <Btn size="xs" variant="danger"
                          onClick={() => setRejectTarget(entry)}>
                          ✕ Tolak
                        </Btn>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Data preview modal */}
      {preview && (
        <Modal
          title={`Preview: ${preview.data?.name || preview.id}`}
          subtitle={`${MDM_TYPES[preview.type]?.label} — diajukan ${DATE(preview.requestedAt)}`}
          onClose={() => setPreview(null)}
        >
          <div className="p-5 space-y-4">
            <DataPreview data={preview.data} />
            {preview.status === "pending" && (
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Btn variant="danger" onClick={() => { setRejectTarget(preview); setPreview(null); }}>
                  ✕ Tolak
                </Btn>
                <Btn variant="success" onClick={() => { handleApprove(preview.id, preview.data?.name); }}>
                  ✅ Setujui & Aktifkan
                </Btn>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          entry={rejectTarget}
          onReject={(reason) => handleReject(rejectTarget.id, reason)}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}
