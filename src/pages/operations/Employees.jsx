import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, FormField, toast, KPICard } from "../../components/ui";
import { IDR, DATE } from "../../lib/fmt";
import { EMPLOYEES } from "../../data/seed";

const DEPTS = ["Produksi", "Quality Control", "Logistik", "Keuangan", "HRD", "IT", "Direksi", "Keamanan", "Maintenance"];
const POSITIONS = {
  "Produksi":       ["Operator Mesin", "Supervisor Produksi", "Kepala Regu", "Helper"],
  "Quality Control":["QC Inspector", "Lab Analyst", "QC Supervisor"],
  "Logistik":       ["Staf Gudang", "Supir Forklift", "Kepala Gudang", "Staf Ekspedisi"],
  "Keuangan":       ["Staf Akuntansi", "Kasir", "Manajer Keuangan"],
  "HRD":            ["Staf HRD", "Manajer HRD", "Rekrutmen"],
  "IT":             ["Teknisi IT", "Programmer", "Manajer IT"],
  "Direksi":        ["Direktur", "Manager", "Asisten Direktur"],
  "Keamanan":       ["Satpam", "Kepala Keamanan"],
  "Maintenance":    ["Teknisi Mesin", "Kepala Maintenance", "Helper Teknisi"],
};

const EMPTY_FORM = {
  name: "", dept: "Produksi", position: "", hire_date: "", salary: "",
  phone: "", address: "", ktp: "", status: "Active",
};

function genEmpNo(existing) {
  const max = existing.reduce((m, e) => {
    const n = parseInt((e.emp_no || "EMP-000").replace("EMP-", ""), 10);
    return n > m ? n : m;
  }, 0);
  return `EMP-${String(max + 1).padStart(3, "0")}`;
}

function NewEmployeeModal({ onClose, onSave, existingEmployees }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const positionList = POSITIONS[form.dept] || [];

  const handleSave = async () => {
    if (!form.name)       { toast("Nama karyawan wajib diisi", "error"); return; }
    if (!form.position)   { toast("Jabatan wajib diisi", "error"); return; }
    if (!form.hire_date)  { toast("Tanggal mulai kerja wajib diisi", "error"); return; }
    if (!form.salary || Number(form.salary) <= 0) { toast("Gaji pokok wajib diisi", "error"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const code = genEmpNo(existingEmployees);
    toast(`✅ Karyawan ${code} – ${form.name} berhasil ditambahkan`);
    onSave({ ...form, emp_no: code, salary: Number(form.salary), id: Date.now().toString() });
    onClose();
  };

  const salary = Number(form.salary) || 0;

  return (
    <Modal title="+ Tambah Karyawan Baru" subtitle="Data karyawan baru · disimpan sebagai aktif" onClose={onClose} width="max-w-2xl">
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="erp-label">No. Karyawan</label>
            <input value={genEmpNo(existingEmployees)} readOnly
              className="erp-input bg-gray-100 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-0.5">Dibuat otomatis</p>
          </div>
          <div>
            <label className="erp-label after:content-['*'] after:text-red-500 after:ml-0.5">Status</label>
            <select value={form.status} onChange={set("status")} className="erp-input">
              <option value="Active">Aktif</option>
              <option value="Inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>

        <FormField label="Nama Lengkap" required>
          <input value={form.name} onChange={set("name")} className="erp-input"
            placeholder="Nama sesuai KTP" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Departemen" required>
            <select value={form.dept} onChange={e => { setForm(p => ({ ...p, dept: e.target.value, position: "" })); }} className="erp-input">
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </FormField>
          <FormField label="Jabatan / Posisi" required>
            <select value={form.position} onChange={set("position")} className="erp-input">
              <option value="">-- Pilih Jabatan --</option>
              {positionList.map(p => <option key={p}>{p}</option>)}
              <option value="__custom">Lainnya…</option>
            </select>
            {form.position === "__custom" && (
              <input className="erp-input mt-2" placeholder="Masukkan jabatan"
                onChange={e => setForm(p => ({ ...p, position: e.target.value }))} />
            )}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Tanggal Mulai Kerja" required>
            <input type="date" value={form.hire_date} onChange={set("hire_date")} className="erp-input" />
          </FormField>
          <FormField label="Gaji Pokok (IDR)" required>
            <input type="number" value={form.salary} onChange={set("salary")} className="erp-input"
              placeholder="4500000" />
            {salary > 0 && <p className="text-xs text-gray-400 mt-0.5">{IDR(salary)} / bulan</p>}
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="No. HP / WhatsApp">
            <input value={form.phone} onChange={set("phone")} className="erp-input"
              placeholder="08xxxxxxxxxx" />
          </FormField>
          <FormField label="No. KTP">
            <input value={form.ktp} onChange={set("ktp")} className="erp-input"
              placeholder="16 digit NIK" maxLength={16} />
          </FormField>
        </div>

        <FormField label="Alamat">
          <textarea value={form.address} onChange={set("address")} className="erp-input min-h-[72px]"
            placeholder="Alamat lengkap karyawan" />
        </FormField>

        {/* Cost preview */}
        {salary > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">💰 Estimasi Biaya SDM</p>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><p className="text-xs text-gray-500">Gaji Pokok</p><p className="font-bold text-gray-900">{IDR(salary)}</p></div>
              <div><p className="text-xs text-gray-500">+BPJS (~5%)</p><p className="font-bold text-gray-700">{IDR(salary * 0.05)}</p></div>
              <div><p className="text-xs text-gray-500">Total / Bulan</p><p className="font-bold text-amber-700">{IDR(salary * 1.05)}</p></div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Btn variant="secondary" onClick={onClose}>Batal</Btn>
          <Btn onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan…" : "💾 Tambah Karyawan"}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function EmployeeDetailModal({ emp, onClose, onEdit }) {
  return (
    <Modal title={emp.name} subtitle={`${emp.emp_no} · ${emp.dept}`} onClose={onClose}>
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["No. Karyawan", emp.emp_no],
            ["Departemen",   emp.dept],
            ["Jabatan",      emp.position],
            ["Mulai Kerja",  DATE(emp.hire_date)],
            ["Gaji Pokok",   IDR(emp.salary)],
            ["Status",       emp.status],
            ...(emp.phone   ? [["No. HP",  emp.phone]]   : []),
            ...(emp.address ? [["Alamat",  emp.address]] : []),
            ...(emp.ktp     ? [["No. KTP", emp.ktp]]     : []),
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-xs text-gray-500">{k}</p>
              <p className="font-medium text-gray-900">{v}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Btn variant="secondary" onClick={onClose}>Tutup</Btn>
          <Btn variant="secondary">📅 Absensi</Btn>
          <Btn variant="secondary">💵 Slip Gaji</Btn>
          {onEdit && <Btn onClick={() => onEdit(emp)}>✏️ Edit</Btn>}
        </div>
      </div>
    </Modal>
  );
}

export default function Employees() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [employees, setEmployees] = useState(EMPLOYEES);
  const [selected, setSelected]   = useState(null);
  const [showAdd, setShowAdd]     = useState(false);

  const depts     = [...new Set(EMPLOYEES.map(e => e.dept))];
  const filtered  = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.dept.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || e.dept === deptFilter;
    return matchSearch && matchDept;
  });

  const totalPayroll = employees.filter(e => e.status === "Active").reduce((s, e) => s + e.salary, 0);
  const active = employees.filter(e => e.status === "Active").length;

  const handleAdd = (newEmp) => {
    setEmployees(prev => [...prev, newEmp]);
  };

  return (
    <div>
      <PageHeader
        title="Karyawan"
        subtitle={`${active} aktif · Total payroll ${IDR(totalPayroll)}/bulan`}
        actions={<Btn onClick={() => setShowAdd(true)}>👤 + Tambah Karyawan</Btn>}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="Total Karyawan" sublabel="Employees" value={employees.length} icon="👥" accent="kpi-blue" />
        <KPICard label="Aktif" sublabel="Active" value={active} icon="✅" color="text-green-700" accent="kpi-green" />
        <KPICard label="Total Payroll" sublabel="Per bulan" value={IDR(totalPayroll)} icon="💵" color="text-gray-900" accent="kpi-gold" />
        <KPICard label="Departemen" sublabel="Departments" value={depts.length} icon="🏢" accent="kpi-blue" />
      </div>

      {/* Dept filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["All", ...depts].map(d => (
          <button key={d} onClick={() => setDeptFilter(d)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              deptFilter === d
                ? "bg-brand-dark text-brand-gold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {d === "All" ? `Semua (${employees.length})` : `${d} (${employees.filter(e => e.dept === d).length})`}
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Cari nama, departemen, jabatan…" /></div>
        <Table
          onRowClick={setSelected}
          columns={[
            { key: "emp_no",   label: "No. Karyawan", render: v => <span className="font-mono text-xs text-blue-700">{v}</span> },
            { key: "name",     label: "Nama Karyawan" },
            { key: "dept",     label: "Departemen" },
            { key: "position", label: "Jabatan" },
            { key: "hire_date",label: "Mulai Kerja", render: DATE },
            { key: "salary",   label: "Gaji Pokok", right: true, render: v => <span className="font-mono">{IDR(v)}</span> },
            { key: "status",   label: "Status", render: v => <Badge status={v} /> },
          ]}
          data={filtered}
          empty="Tidak ada karyawan ditemukan"
        />
      </Card>

      {showAdd && (
        <NewEmployeeModal
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
          existingEmployees={employees}
        />
      )}

      {selected && (
        <EmployeeDetailModal
          emp={selected}
          onClose={() => setSelected(null)}
          onEdit={null}
        />
      )}
    </div>
  );
}
