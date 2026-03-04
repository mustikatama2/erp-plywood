import { PageHeader, Card, KPICard, Btn } from "../../components/ui";
import { IDR, PCT } from "../../lib/fmt";
import { EMPLOYEES } from "../../data/seed";

export default function Payroll() {
  const gross   = EMPLOYEES.reduce((s,e)=>s+e.salary, 0);
  const pph21   = Math.round(gross * 0.05);
  const bpjsKes = Math.round(gross * 0.01);
  const net     = gross - pph21 - bpjsKes;

  return (
    <div>
      <PageHeader title="Payroll" subtitle="March 2026" actions={<Btn>Run Payroll</Btn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPICard label="Gross Payroll"  value={IDR(gross)}   icon="💰" color="text-gray-900" />
        <KPICard label="PPh 21 (est.)"  value={IDR(pph21)}   icon="🏛️" color="text-amber-700" />
        <KPICard label="BPJS Kesehatan" value={IDR(bpjsKes)} icon="🏥" color="text-blue-700" />
        <KPICard label="Net to Transfer"value={IDR(net)}     icon="✅" color="text-green-700" />
      </div>

      <Card title="Payroll Preview — March 2026">
        <table className="erp-table">
          <thead><tr><th>Employee</th><th>Department</th><th className="text-right">Basic Salary</th><th className="text-right">PPh 21</th><th className="text-right">BPJS</th><th className="text-right">Net Pay</th></tr></thead>
          <tbody>
            {EMPLOYEES.map(e => {
              const tax  = Math.round(e.salary * 0.05);
              const bpjs = Math.round(e.salary * 0.01);
              return (
                <tr key={e.id}>
                  <td><p className="font-medium">{e.name}</p><p className="text-xs text-gray-500">{e.emp_no}</p></td>
                  <td className="text-gray-400">{e.dept}</td>
                  <td className="text-right font-mono">{IDR(e.salary)}</td>
                  <td className="text-right font-mono text-amber-700">{IDR(tax)}</td>
                  <td className="text-right font-mono text-blue-700">{IDR(bpjs)}</td>
                  <td className="text-right font-black text-green-700">{IDR(e.salary-tax-bpjs)}</td>
                </tr>
              );
            })}
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
          <Btn variant="secondary">📤 Export Slip</Btn>
          <Btn variant="success">Post to Journal</Btn>
          <Btn>Confirm & Transfer</Btn>
        </div>
      </Card>
    </div>
  );
}
