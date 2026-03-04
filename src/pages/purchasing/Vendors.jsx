import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal } from "../../components/ui";
import { IDR } from "../../lib/fmt";
import { VENDORS, AP_INVOICES } from "../../data/seed";

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const enriched = VENDORS.map(v => ({
    ...v,
    open_bills: AP_INVOICES.filter(i => i.vendor_id===v.id && i.status!=="Paid").length,
  }));

  const filtered = enriched.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Vendors" subtitle={`${VENDORS.length} registered`} actions={<Btn>+ Add Vendor</Btn>} />
      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Search name, category…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"code",         label:"Code",        render:v=><span className="font-mono text-xs text-gray-400">{v}</span> },
          { key:"name",         label:"Vendor"       },
          { key:"category",     label:"Category"     },
          { key:"contact",      label:"Contact"      },
          { key:"payment_terms",label:"Terms"        },
          { key:"ap_balance",   label:"AP Balance",  right:true, render:v=><span className={v>0?"font-bold text-amber-300":"text-gray-500"}>{IDR(v)}</span> },
          { key:"open_bills",   label:"Open Bills",  right:true, render:v=>v>0?<span className="text-amber-400 font-bold">{v}</span>:<span className="text-gray-600">0</span> },
        ]} data={filtered} />
      </Card>
      {selected && (
        <Modal title={selected.name} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Code",selected.code],["Category",selected.category],["Contact",selected.contact],
                ["Payment Terms",selected.payment_terms],["AP Balance",IDR(selected.ap_balance)],
                ["Open Bills",selected.open_bills]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Close</Btn>
              <Btn>+ New PO</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
