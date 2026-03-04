import { useState } from "react";
import { Modal, Btn, toast } from "../ui";
import { parseDocument } from "../../lib/aiClient";
import { IDR, DATE } from "../../lib/fmt";

const CONFIDENCE_COLOR = (c) =>
  c >= 0.85 ? "text-green-400" : c >= 0.65 ? "text-amber-400" : "text-red-400";

const CONFIDENCE_LABEL = (c) =>
  c >= 0.85 ? "Tinggi" : c >= 0.65 ? "Sedang" : "Rendah";

export function DocumentParserButton({ onExtracted }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn variant="secondary" size="sm" onClick={() => setOpen(true)}>
        🤖 Parse dari Dokumen
      </Btn>
      {open && <DocumentParserModal onClose={() => setOpen(false)} onExtracted={(data) => { onExtracted(data); setOpen(false); }} />}
    </>
  );
}

function DocumentParserModal({ onClose, onExtracted }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState("input"); // input | preview

  const exampleText = `PT. Rimba Kalimantan Lestari
Invoice No: SINV-2026-0502
Date: 04 March 2026
Payment Terms: NET 45

To: PT. Mustikatama Graha Persada

Description:
- Log Meranti Grade A, 85 m3 @ Rp 950,000/m3 = Rp 80,750,000

Subtotal: Rp 80,750,000
PPN 11%:  Rp 8,882,500
TOTAL:    Rp 89,632,500`;

  const handleParse = async () => {
    if (!text.trim()) { toast("Tempelkan teks dokumen terlebih dahulu", "error"); return; }
    setLoading(true);
    try {
      const data = await parseDocument(text);
      setResult(data);
      setStep("preview");
    } catch (e) {
      toast("Gagal memproses dokumen: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    onExtracted(result);
    toast("Data berhasil diisi ke formulir ✅");
  };

  return (
    <Modal title="🤖 AI Document Parser" subtitle="Tempelkan teks faktur untuk ekstraksi otomatis" onClose={onClose} width="max-w-2xl">
      {step === "input" && (
        <div className="p-5 space-y-4">
          {/* What to do */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
            <p className="font-bold mb-2">📋 Cara menggunakan:</p>
            <ol className="space-y-1 text-xs">
              <li>1. Buka faktur/invoice dalam PDF, email, atau foto</li>
              <li>2. Salin semua teks dari dokumen tersebut (Ctrl+A → Ctrl+C)</li>
              <li>3. Tempelkan di sini (Ctrl+V)</li>
              <li>4. Klik "Analisis" — AI akan mengisi form secara otomatis</li>
            </ol>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="erp-label">Teks Dokumen / Invoice</label>
              <Btn size="xs" variant="ghost" onClick={() => setText(exampleText)}>
                Gunakan contoh
              </Btn>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Tempelkan teks dari faktur vendor di sini…&#10;&#10;Bisa dalam Bahasa Indonesia atau Inggris."
              className="erp-input h-52 resize-none font-mono text-xs"
            />
            <p className="text-xs text-gray-600 mt-1">{text.length} karakter</p>
          </div>

          <div className="flex justify-end gap-2">
            <Btn variant="secondary" onClick={onClose}>Batal</Btn>
            <Btn onClick={handleParse} disabled={loading || !text.trim()}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Menganalisis…
                </span>
              ) : "🔍 Analisis Dokumen"}
            </Btn>
          </div>
        </div>
      )}

      {step === "preview" && result && (
        <div className="p-5 space-y-4">
          {/* Confidence indicator */}
          <div className={`flex items-center gap-3 p-3 rounded-xl border ${
            result.confidence >= 0.85 ? "bg-green-500/10 border-green-500/20" :
            result.confidence >= 0.65 ? "bg-amber-500/10 border-amber-500/20" :
            "bg-red-500/10 border-red-500/20"
          }`}>
            <span className="text-2xl">
              {result.confidence >= 0.85 ? "✅" : result.confidence >= 0.65 ? "⚠️" : "❌"}
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                Tingkat Kepercayaan: <span className={CONFIDENCE_COLOR(result.confidence)}>
                  {CONFIDENCE_LABEL(result.confidence)} ({Math.round((result.confidence||0.6)*100)}%)
                </span>
              </p>
              <p className="text-xs text-gray-400">
                {result.confidence >= 0.85 ? "Data berhasil diekstrak dengan baik. Silakan periksa dan konfirmasi." :
                 result.confidence >= 0.65 ? "Beberapa field mungkin perlu dikoreksi manual setelah diisi." :
                 "Ekstraksi kurang akurat — periksa semua field dengan teliti sebelum menyimpan."}
              </p>
              {result._demo && <p className="text-xs text-blue-400 mt-0.5">Mode demo — koneksikan server untuk AI penuh</p>}
            </div>
          </div>

          {/* Extracted fields */}
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Nama Vendor",    result.vendor_name],
              ["No. Invoice",    result.inv_no],
              ["Tanggal",        DATE(result.date)],
              ["Jatuh Tempo",    DATE(result.due_date)],
              ["Total",          result.currency === "USD" ? `$ ${result.total}` : IDR(result.total)],
              ["Mata Uang",      result.currency],
              ["Deskripsi",      result.description],
            ].map(([label, value]) => (
              <div key={label} className="erp-card p-3">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className={`text-sm font-medium ${value && value !== "Tidak terdeteksi" ? "text-white" : "text-gray-500"}`}>
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>

          {/* Line items */}
          {result.items?.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Item yang Ditemukan</p>
              <table className="erp-table">
                <thead><tr><th>Deskripsi</th><th>Qty</th><th className="text-right">Harga</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {result.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.description}</td>
                      <td>{item.qty} {item.unit}</td>
                      <td className="text-right">{IDR(item.unit_price)}</td>
                      <td className="text-right font-bold">{IDR(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.notes && (
            <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-400">
              📝 {result.notes}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-800">
            <Btn variant="ghost" onClick={() => { setStep("input"); setResult(null); }}>
              ← Ulangi
            </Btn>
            <div className="flex gap-2">
              <Btn variant="secondary" onClick={onClose}>Batal</Btn>
              <Btn onClick={handleConfirm}>✅ Gunakan Data Ini</Btn>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
