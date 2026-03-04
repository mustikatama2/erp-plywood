import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Btn, Modal, FormField, Badge, Table, EmptyState, toast } from "../../components/ui";
import { DATE } from "../../lib/fmt";
import { PURCHASE_ORDERS, VENDORS } from "../../data/seed";

const today = new Date().toISOString().split("T")[0];
const ELIGIBLE_POS = PURCHASE_ORDERS.filter(po => ["Confirmed", "Approved", "Sent", "In Progress"].includes(po.status));

function genGRNo(receipts) {
  if (!receipts.length) return "GR-001";
  const max = Math.max(...receipts.map(r => parseInt(r.gr_no.split("-")[1] || "0")));
  return `GR-${String(max + 1).padStart(3, "0")}`;
}

function ReceiveGoodsModal({ onClose, onSave, receipts }) {
  const [form, setForm] = useState({
    po_id: "",
    tanggal: today,
    gudang: "Gudang Utama",
    kondisi: "Baik",
    catatan: "",
  });
  const [qtys, setQtys] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedPO = PURCHASE_ORDERS.find(po => po.id === form.po_id);
  const vendor = selectedPO ? VENDORS.find(v => v.id === selectedPO.vendor_id) : null;

  const handlePOChange = (po_id) => {
    set("po_id", po_id);
    const po = PURCHASE_ORDERS.find(p => p.id === po_id);
    if (po) {
      const initQtys = {};
      po.lines.forEach((line, i) => { initQtys[i] = line.qty; });
      setQtys(initQtys);
    }
  };

  const handleSave = () => {
    if (!form.po_id) return toast("Pilih Purchase Order terlebih dahulu", "error");
    const gr_no = genGRNo(receipts);
    onSave({
      id: `gr-${Date.now()}`,
      gr_no,
      po_id: form.po_id,
      po_no: selectedPO?.po_no,
      vendor: vendor?.name || "—",
      tanggal: form.tanggal,
      gudang: form.gudang,
      kondisi: form.kondisi,
      catatan: form.catatan,
      lines: (selectedPO?.lines || []).map((line, i) => ({
        ...line,
        qty_diterima: Number(qtys[i] || 0),
      })),
      status: "Diterima",
    });
    toast(`✅ ${gr_no} berhasil dicatat`, "success");
    onClose();
  };

  return (
    <Modal title="Terima Barang (Goods Receipt)" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="No. GR">
            <input className="erp-input w-full bg-gray-50 text-gray-500" readOnly value={genGRNo(receipts)} />
          </FormField>
          <FormField label="Tanggal Terima" required>
            <input type="date" className="erp-input w-full" value={form.tanggal} onChange={e => set("tanggal", e.target.value)} />
          </FormField>
        </div>

        <FormField label="Pilih Purchase Order" required>
          <select className="erp-input w-full" value={form.po_id} onChange={e => handlePOChange(e.target.value)}>
            <option value="">— Pilih PO —</option>
            {ELIGIBLE_POS.map(po => (
              <option key={po.id} value={po.id}>
                {po.po_no} — {VENDORS.find(v => v.id === po.vendor_id)?.name || "Vendor"} ({po.status})
              </option>
            ))}
          </select>
        </FormField>

        {vendor && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500">Vendor</p>
            <p className="font-bold text-gray-900">{vendor.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{vendor.category} · {vendor.payment_terms}</p>
          </div>
        )}

        <FormField label="Gudang Tujuan" required>
          <select className="erp-input w-full" value={form.gudang} onChange={e => set("gudang", e.target.value)}>
            <option>Gudang Utama</option>
            <option>Gudang Transit</option>
            <option>Cold Storage</option>
          </select>
        </FormField>

        {selectedPO && selectedPO.lines.length > 0 && (
          <div>
            <p className="erp-label mb-2">Detail Item PO</p>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Produk</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">Qty Order</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">Qty Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPO.lines.map((line, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <p className="font-medium text-gray-900">{line.product}</p>
                        <p className="text-xs text-gray-500">{line.unit}</p>
                      </td>
                      <td className="px-3 py-2 text-right text-gray-500">{line.qty.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max={line.qty}
                          className="erp-input w-24 text-right"
                          value={qtys[i] ?? line.qty}
                          onChange={e => setQtys(q => ({ ...q, [i]: e.target.value }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <FormField label="Kondisi Barang" required>
          <select className="erp-input w-full" value={form.kondisi} onChange={e => set("kondisi", e.target.value)}>
            <option>Baik</option>
            <option>Rusak Sebagian</option>
            <option>Ditolak</option>
          </select>
        </FormField>

        <FormField label="Catatan">
          <textarea className="erp-input w-full" rows={2} placeholder="Catatan penerimaan…" value={form.catatan} onChange={e => set("catatan", e.target.value)} />
        </FormField>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan GR</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function GoodsReceipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [showAdd, setShowAdd] = useState(false);

  const handleSave = (gr) => {
    setReceipts(prev => [gr, ...prev]);
  };

  return (
    <div>
      <PageHeader title="Goods Receipts" subtitle={receipts.length > 0 ? `${receipts.length} receipt(s)` : undefined}
        actions={<Btn onClick={() => setShowAdd(true)}>+ Receive Goods</Btn>} />

      <Card>
        {receipts.length === 0 ? (
          <EmptyState
            icon="📦"
            title="Belum ada penerimaan barang"
            subtitle="Terima barang dari Purchase Order untuk mencatat Goods Receipt"
            action={
              <div className="flex justify-center gap-2">
                <Btn onClick={() => setShowAdd(true)}>+ Receive Goods</Btn>
                <Btn variant="secondary" onClick={() => navigate("/purchasing/orders")}>Go to Purchase Orders</Btn>
              </div>
            }
          />
        ) : (
          <Table
            columns={[
              { key: "gr_no",   label: "No. GR",  render: v => <span className="font-mono font-bold text-blue-700">{v}</span> },
              { key: "po_no",   label: "Ref. PO",  render: v => <span className="font-mono text-xs">{v}</span> },
              { key: "vendor",  label: "Vendor" },
              { key: "tanggal", label: "Tgl Terima", render: DATE },
              { key: "gudang",  label: "Gudang" },
              { key: "kondisi", label: "Kondisi", render: v => (
                <span className={`text-xs font-bold ${v === "Baik" ? "text-green-700" : v === "Rusak Sebagian" ? "text-amber-700" : "text-red-700"}`}>{v}</span>
              )},
              { key: "status",  label: "Status", render: v => <Badge status={v} /> },
            ]}
            data={receipts}
          />
        )}
      </Card>

      {showAdd && (
        <ReceiveGoodsModal
          onClose={() => setShowAdd(false)}
          onSave={handleSave}
          receipts={receipts}
        />
      )}
    </div>
  );
}
