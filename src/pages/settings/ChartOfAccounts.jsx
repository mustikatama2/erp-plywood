import { useState } from "react";
import { PageHeader, Card, Btn, SearchBar, Table, Modal, FormField, toast } from "../../components/ui";
import { ACCOUNTS } from "../../data/seed";

const TYPE_COLORS = {
  asset:     "bg-blue-500/20 text-blue-700",
  liability: "bg-red-500/20 text-red-700",
  equity:    "bg-purple-500/20 text-purple-700",
  revenue:   "bg-green-500/20 text-green-700",
  expense:   "bg-amber-500/20 text-amber-700",
};

function AddAccountModal({ onClose, onSave, accounts }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "asset",
    parent: "",
    normal: "debit",
    is_header: false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.code.trim()) return toast("Kode Akun wajib diisi", "error");
    if (!form.name.trim()) return toast("Nama Akun wajib diisi", "error");
    if (accounts.find(a => a.code === form.code.trim())) return toast("Kode akun sudah digunakan", "error");
    onSave({
      id: `acc-${Date.now()}`,
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      parent: form.parent || undefined,
      normal: form.normal,
      is_header: form.is_header,
    });
    toast(`✅ Akun ${form.code.trim()} berhasil ditambahkan`, "success");
    onClose();
  };

  return (
    <Modal title="Tambah Akun Baru" onClose={onClose} width="max-w-lg">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Kode Akun" required>
            <input type="text" className="erp-input w-full font-mono" placeholder="e.g. 1-1010" value={form.code} onChange={e => set("code", e.target.value)} />
          </FormField>
          <FormField label="Tipe Akun" required>
            <select className="erp-input w-full" value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="asset">Asset</option>
              <option value="liability">Liability</option>
              <option value="equity">Equity</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
            </select>
          </FormField>
        </div>

        <FormField label="Nama Akun" required>
          <input type="text" className="erp-input w-full" placeholder="Nama akun…" value={form.name} onChange={e => set("name", e.target.value)} />
        </FormField>

        <FormField label="Parent Account">
          <select className="erp-input w-full" value={form.parent} onChange={e => set("parent", e.target.value)}>
            <option value="">— Tidak ada (akun root) —</option>
            {accounts.filter(a => a.is_header).map(a => (
              <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Normal Balance">
          <select className="erp-input w-full" value={form.normal} onChange={e => set("normal", e.target.value)}>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </FormField>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded"
            checked={form.is_header}
            onChange={e => set("is_header", e.target.checked)}
          />
          <span className="text-sm text-gray-700">Akun Induk / Header</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave}>💾 Simpan Akun</Btn>
        </div>
      </div>
    </Modal>
  );
}

export default function ChartOfAccounts() {
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showAdd, setShowAdd]     = useState(false);
  const [localAccounts, setLocalAccounts] = useState([]);

  const TYPES = ["All", "asset", "liability", "equity", "revenue", "expense"];
  const allAccounts = [...localAccounts, ...ACCOUNTS];

  const filtered = allAccounts
    .filter(a => typeFilter === "All" || a.type === typeFilter)
    .filter(a => a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Chart of Accounts" subtitle={`${allAccounts.length} accounts`}
        actions={<Btn onClick={() => setShowAdd(true)}>+ Add Account</Btn>} />

      <Card>
        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search code, name…" />
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium capitalize transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Table columns={[
          { key: "code",   label: "Code",         render: v => <span className="font-mono font-bold text-blue-700">{v}</span> },
          { key: "name",   label: "Account Name", render: (v, r) => (
            <span className={r.is_header ? "font-black text-gray-900 uppercase text-xs tracking-wider" : ""}>{v}</span>
          )},
          { key: "type",   label: "Type",         render: v => (
            <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${TYPE_COLORS[v]}`}>{v}</span>
          )},
          { key: "parent", label: "Parent",       render: v => {
            const p = allAccounts.find(a => a.id === v);
            return p ? <span className="text-xs text-gray-500">{p.code} — {p.name}</span> : "—";
          }},
          { key: "normal", label: "Normal Balance", render: v => v ? <span className="text-xs capitalize text-gray-400">{v}</span> : "—" },
        ]} data={filtered} />
      </Card>

      {showAdd && (
        <AddAccountModal
          onClose={() => setShowAdd(false)}
          onSave={acc => setLocalAccounts(prev => [acc, ...prev])}
          accounts={allAccounts}
        />
      )}
    </div>
  );
}
