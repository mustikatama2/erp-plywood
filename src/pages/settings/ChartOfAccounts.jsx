import { useState } from "react";
import { PageHeader, Card, Btn, SearchBar, Table } from "../../components/ui";
import { ACCOUNTS } from "../../data/seed";

const TYPE_COLORS = {
  asset:     "bg-blue-500/20 text-blue-400",
  liability: "bg-red-500/20 text-red-400",
  equity:    "bg-purple-500/20 text-purple-400",
  revenue:   "bg-green-500/20 text-green-400",
  expense:   "bg-amber-500/20 text-amber-400",
};

export default function ChartOfAccounts() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const TYPES = ["All","asset","liability","equity","revenue","expense"];
  const filtered = ACCOUNTS
    .filter(a => typeFilter==="All" || a.type===typeFilter)
    .filter(a => a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Chart of Accounts" subtitle={`${ACCOUNTS.length} accounts`}
        actions={<Btn>+ Add Account</Btn>} />

      <Card>
        <div className="flex gap-3 mb-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search code, name…" />
          <div className="flex gap-1.5 flex-wrap">
            {TYPES.map(t=>(
              <button key={t} onClick={()=>setTypeFilter(t)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium capitalize transition-colors ${typeFilter===t?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <Table columns={[
          { key:"code",      label:"Code",    render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"name",      label:"Account Name", render:(v,r)=>(
            <span className={r.is_header?"font-black text-white uppercase text-xs tracking-wider":""}>{v}</span>
          )},
          { key:"type",      label:"Type",    render:v=>(
            <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${TYPE_COLORS[v]}`}>{v}</span>
          )},
          { key:"parent",    label:"Parent",  render:v=>{
            const p = ACCOUNTS.find(a=>a.id===v);
            return p ? <span className="text-xs text-gray-500">{p.code} — {p.name}</span> : "—";
          }},
          { key:"normal",    label:"Normal Balance", render:v=>v?<span className="text-xs capitalize text-gray-400">{v}</span>:"—" },
        ]} data={filtered} />
      </Card>
    </div>
  );
}
