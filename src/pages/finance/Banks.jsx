import { useState } from "react";
import { PageHeader, Card, Btn, Modal, FormField, toast } from "../../components/ui";
import { IDR } from "../../lib/fmt";
import { BANK_ACCOUNTS } from "../../data/seed";

const today = new Date().toISOString().split("T")[0];

function AddTransactionModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    date: today,
    bank_id: BANK_ACCOUNTS[0]?.id || "",
    jenis: "Masuk",
    deskripsi: "",
    jumlah: "",
    referensi: "",
    catatan: "",
  });

  const selectedBank = BANK_ACCOUNTS.find(b => b.id === form.bank_id);
  const isUSD = selectedBank?.currency === "USD";

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.deskripsi.trim()) return toast("Deskripsi wajib diisi", "error");
    if (!form.jumlah || Number(form.jumlah) <= 0) return toast("Jumlah wajib diisi", "error");
    onSave({
      date: form.date,
      desc: form.deskripsi,
      acc: selectedBank?.name,
      currency: selectedBank?.currency,
      jenis: form.jenis,
      amount: Number(form.jumlah),
      referensi: form.referensi,
      catatan: form.catatan,
      debit: form.jenis === "Keluar" ? Number(form.jumlah) : 0,
      credit: form.jenis === "Masuk" ? Number(form.jumlah) : 0,
    });
    toast("✅ Transaksi berhasil dicatat", "success");
    onClose();
  };

  return (
    <Modal title="Tambah Transaksi" onClose={onClose} width="max-w-lg">
      <div className="p-5 space-y-4">
        <FormField label="Tanggal" required>
          <input type="date" className="erp-input w-full" value={form.date} onChange={e => set("date", e.target.value)} />
        </FormField>
        <FormField label="Akun Bank" required>
          <select className="erp-input w-full" value={form.bank_id} onChange={e => set("bank_id", e.target.value)}>
            {BANK_ACCOUNTS.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>
            ))}
          </select>
        </FormField>
        <FormField label="Jenis Transaksi" required>
          <select className="erp-input w-full" value={form.jenis} onChange={e => set("jenis", e.target.value)}>
            <option>Masuk</option>
            <option>Keluar</option>
          </select>
        </FormField>
        <FormField label="Deskripsi" required>
          <input type="text" className="erp-input w-full" placeholder="Keterangan transaksi…" value={form.deskripsi} onChange={e => set("deskripsi", e.target.value)} />
        </FormField>
        <FormField label={isUSD ? "Jumlah (USD)" : "Jumlah (IDR)"} required>
          <input type="number" className="erp-input w-full" placeholder="0" min="0" value={form.jumlah} onChange={e => set("jumlah", e.target.value)} />
        </FormField>
        <FormField label="Referensi">
          <input type="text" className="erp-input w-full" placeholder="No. referensi (opsional)" value={form.referensi} onChange={e => set("referensi", e.target.value)} />
        </FormField>
        <FormField label="Catatan">
          <textarea className="erp-input w-full" rows={2} placeholder="Catatan tambahan…" value={form.catatan} onChange={e => set("catatan", e.target.value)} />
        </FormField>
        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>Simpan Transaksi</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function Banks() {
  const [showAdd, setShowAdd] = useState(false);
  const [transactions, setTransactions] = useState([
    { date:"2026-03-04", desc:"Customer payment — Yamamoto Trading", credit:250000000, debit:0,     acc:"BCA — IDR Operasional",  currency:"IDR", jenis:"Masuk" },
    { date:"2026-03-03", desc:"Vendor payment — PT. Rimba Kalimantan", credit:0, debit:76000000,   acc:"BCA — IDR Operasional",  currency:"IDR", jenis:"Keluar" },
    { date:"2026-03-03", desc:"USD inflow — Shanghai Fuhua", credit:45000, debit:0,                acc:"BCA — USD Export",       currency:"USD", jenis:"Masuk" },
    { date:"2026-03-02", desc:"Payroll transfer to Mandiri", credit:0, debit:320000000,            acc:"Mandiri — IDR Payroll",  currency:"IDR", jenis:"Keluar" },
    { date:"2026-03-01", desc:"Export proceeds — LC settlement", credit:32500, debit:0,           acc:"BCA — USD Export",       currency:"USD", jenis:"Masuk" },
    { date:"2026-02-28", desc:"Electricity payment — PT. Listrik", credit:0, debit:23000000,       acc:"BCA — IDR Operasional",  currency:"IDR", jenis:"Keluar" },
  ]);

  // Compute additional balance from new transactions
  const extraIDR = transactions.slice(0, transactions.length - 6).reduce((s, t) => {
    const val = t.currency === "USD" ? (t.credit - t.debit) * 15560 : (t.credit - t.debit);
    return s + val;
  }, 0);

  const baseIDR = BANK_ACCOUNTS.reduce((s, b) => s + (b.currency === "USD" ? b.balance * 15560 : b.balance), 0);
  const totalIDR = baseIDR + extraIDR;

  const handleSave = (txn) => {
    setTransactions(prev => [txn, ...prev]);
  };

  return (
    <div>
      <PageHeader title="Banks & Cash" actions={<Btn onClick={() => setShowAdd(true)}>+ Add Transaction</Btn>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {BANK_ACCOUNTS.map(b => (
          <div key={b.id} className="erp-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-bold text-gray-900 text-sm">{b.name}</p>
                <p className="text-xs text-gray-500">{b.bank}</p>
                <p className="font-mono text-xs text-gray-500 mt-0.5">{b.no}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${b.currency === "USD" ? "bg-green-500/20 text-green-700" : "bg-blue-500/20 text-blue-700"}`}>{b.currency}</span>
            </div>
            <p className={`text-2xl font-black ${b.currency === "USD" ? "text-green-700" : "text-gray-900"}`}>
              {b.currency === "USD" ? `$ ${b.balance.toLocaleString()}` : IDR(b.balance)}
            </p>
            {b.currency === "USD" && <p className="text-xs text-gray-500 mt-1">≈ {IDR(b.balance * 15560)}</p>}
          </div>
        ))}
      </div>

      <div className="erp-card px-5 py-3 mb-5 flex items-center justify-between">
        <span className="text-gray-400">Total Cash & Bank (IDR equivalent)</span>
        <span className="text-2xl font-black text-teal-600">{IDR(totalIDR)}</span>
      </div>

      <Card title="Recent Transactions">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Account</th>
              <th className="text-right">Debit</th>
              <th className="text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i}>
                <td className="text-xs text-gray-500">{t.date}</td>
                <td>{t.desc}</td>
                <td className="text-xs text-gray-400">{t.acc}</td>
                <td className="text-right text-red-700">
                  {t.debit > 0 ? (t.currency === "USD" ? `$ ${t.debit.toLocaleString()}` : IDR(t.debit)) : ""}
                </td>
                <td className="text-right text-green-700">
                  {t.credit > 0 ? (t.currency === "USD" ? `$ ${t.credit.toLocaleString()}` : IDR(t.credit)) : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} onSave={handleSave} />}
    </div>
  );
}
