import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR, DATE } from "../../lib/fmt";
import { EMPLOYEES } from "../../data/seed";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const depts = [...new Set(EMPLOYEES.map(e=>e.dept))];
  const filtered = EMPLOYEES.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.dept.toLowerCase().includes(search.toLowerCase()) ||
    e.position.toLowerCase().includes(search.toLowerCase())
  );

  const totalPayroll = EMPLOYEES.reduce((s,e)=>s+e.salary,0);

  return (
    <div>
      <PageHeader title="Employees" subtitle={`${EMPLOYEES.length} active · ${IDR(totalPayroll)}/month payroll`}
        actions={<Btn>+ Add Employee</Btn>} />

      {/* Dept summary */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {depts.map(d=>(
          <div key={d} className="erp-card px-3 py-2 text-sm">
            <span className="text-gray-400">{d}</span>
            <span className="ml-2 font-black text-white">{EMPLOYEES.filter(e=>e.dept===d).length}</span>
          </div>
        ))}
      </div>

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search name, dept, position…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"emp_no",   label:"Emp No",    render:v=><span className="font-mono text-xs text-gray-400">{v}</span> },
          { key:"name",     label:"Name"       },
          { key:"dept",     label:"Department" },
          { key:"position", label:"Position"   },
          { key:"hire_date",label:"Since",      render:DATE },
          { key:"salary",   label:"Salary",    right:true, render:v=><span className="font-mono">{IDR(v)}</span> },
          { key:"status",   label:"Status",    render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.name} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Emp No",selected.emp_no],["Department",selected.dept],["Position",selected.position],
                ["Hire Date",DATE(selected.hire_date)],["Salary",IDR(selected.salary)],["Status",selected.status]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn variant="secondary">Attendance</Btn>
              <Btn>Edit</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
