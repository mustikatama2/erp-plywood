import { useState } from "react";
import { PageHeader, Card, KPICard, Btn, Modal, toast } from "../../components/ui";
import { IDR, exportCSV } from "../../lib/fmt";
import { EMPLOYEES } from "../../data/seed";

export default function Payroll() {
  const [showRunModal, setShowRunModal]       = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [payrollRan, setPayrollRan]           = useState(false);
  const [journalPosted, setJournalPosted]     = useState(false);
  const [transferred, setTransferred]         = useState(false);

  const gross    = EMPLOYEES.reduce((s, e) => s + e.salary, 0);
  const pph21    = Math.round(gross * 0.05);
  const bpjsKes  = Math.round(gross * 0.01);
  const net      = gross - pph21 - bpjsKes;

  const rows = EMPLOYEES.map(e => {
    const tax  = Math.round(e.salary * 0.05);
    const bpjs = Math.round(e.salary * 0.01);
    return { ...e, tax, bpjs, net_pay: e.salary - tax - bpjs };
  });

  const handleExport = () => {
    exportCSV(
      rows.map(r => ({
        Nama: r.name,
        Departemen: r.dept,
        "Gaji Pokok": r.salary,
        "PPh 21": r.tax,
        "BPJS Kesehatan": r.bpjs,
        "Net Pay": r.net_pay,
      })),
      "payroll-maret-2026.csv"
    );
  };

  const handlePostJournal = () => {
    toast(`📒 Jurnal payroll diposting: Dr. Beban Gaji ${IDR(gross)} | Cr. Utang Gaji ${IDR(net)} | Cr. Hutang PPh21 ${IDR(pph21)}`, "success");
    setJournalPosted(true);
  };

  return (
    <div>
      <PageHeader title="Payroll" subtitle="March 2026"
        actions={
          payrollRan
            ? <Btn disabled>✅ Sudah Diproses</Btn>
            : <Btn onClick={() => setShowRunModal(true)}>Run Payroll</Btn>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Gross Payroll"   value={IDR(gross)}   icon="💰" color="text-gray-900" />
        <KPICard label="PPh 21 (est.)"   value={IDR(pph21)}   icon="🏛️" color="text-amber-700" />
        <KPICard label="BPJS Kesehatan"  value={IDR(bpjsKes)} icon="🏥" color="text-blue-700" />
        <KPICard label="Net to Transfer" value={IDR(net)}     icon="✅" color="text-green-700" />
      </div>

      <Card title="Payroll Preview — March 2026">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th className="text-right">Basic Salary</th>
              <th className="text-right">PPh 21</th>
              <th className="text-right">BPJS</th>
              <th className="text-right">Net Pay</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(e => (
              <tr key={e.id}>
                <td><p className="font-medium">{e.name}</p><p className="text-xs text-gray-500">{e.emp_no}</p></td>
                <td className="text-gray-400">{e.dept}</td>
                <td className="text-right font-mono">{IDR(e.salary)}</td>
                <td className="text-right font-mono text-amber-700">{IDR(e.tax)}</td>
                <td className="text-right font-mono text-blue-700">{IDR(e.bpjs)}</td>
                <td className="text-right font-black text-green-700">{IDR(e.net_pay)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-black text-gray-900 border-t-2 border-gray-200">
              <td colSpan={2} className="px-4 py-2">TOTAL</td>
              <td className="text-right px-4 py-2">{IDR(gross)}</td>
              <td className="text-right px-4 py-2 text-amber-700">{IDR(pph21)}</td>
              <td className="text-right px-4 py-2 text-blue-700">{IDR(bpjsKes)}</td>
              <td className="text-right px-4 py-2 text-green-700">{IDR(net)}</td>
            </tr>
          </tfoot>
        </table>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={handleExport}>📤 Export Slip</Btn>
          <Btn variant="success" disabled={journalPosted} onClick={handlePostJournal}>
            {journalPosted ? "✅ Jurnal Diposting" : "Post to Journal"}
          </Btn>
          <Btn disabled={transferred} onClick={() => setShowTransferModal(true)}>
            {transferred ? "✅ Transfer Selesai" : "Confirm & Transfer"}
          </Btn>
        </div>
      </Card>

      {/* Run Payroll Confirmation Modal */}
      {showRunModal && (
        <Modal title="Jalankan Payroll Maret 2026" onClose={() => setShowRunModal(false)} width="max-w-md">
          <div className="p-5 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Gross Payroll</span>
                <span className="font-bold">{IDR(gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PPh 21</span>
                <span className="font-bold text-amber-700">- {IDR(pph21)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">BPJS Kesehatan</span>
                <span className="font-bold text-blue-700">- {IDR(bpjsKes)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-blue-200 pt-2 mt-2">
                <span className="font-bold text-gray-900">Net Transfer</span>
                <span className="font-black text-green-700">{IDR(net)}</span>
              </div>
              <p className="text-xs text-gray-500 pt-1">{EMPLOYEES.length} karyawan</p>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setShowRunModal(false)}>Batal</Btn>
              <Btn variant="solid_green" onClick={() => {
                setPayrollRan(true);
                setShowRunModal(false);
                toast("✅ Payroll Maret 2026 berhasil diproses", "success");
              }}>✅ Jalankan Payroll</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Confirm & Transfer Modal */}
      {showTransferModal && (
        <Modal title="Konfirmasi Transfer Gaji" onClose={() => setShowTransferModal(false)} width="max-w-md">
          <div className="p-5 space-y-4">
            <p className="text-gray-700">Transfer gaji ke rekening karyawan?</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
              <span className="text-gray-500 text-sm">Total Net Transfer</span>
              <span className="text-2xl font-black text-green-700">{IDR(net)}</span>
            </div>
            <p className="text-sm text-gray-500">{EMPLOYEES.length} rekening karyawan</p>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={() => setShowTransferModal(false)}>Batal</Btn>
              <Btn variant="solid_green" onClick={() => {
                setTransferred(true);
                setShowTransferModal(false);
                toast(`✅ Transfer payroll berhasil dikonfirmasi · ${IDR(net)} dikirim ke ${EMPLOYEES.length} rekening`, "success");
              }}>✅ Transfer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
