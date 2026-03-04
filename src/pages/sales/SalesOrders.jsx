import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, DATE, days_from_now, TODAY, exportCSV } from "../../lib/fmt";
import { SALES_ORDERS, CUSTOMERS, PRODUCTS } from "../../data/seed";

const BLANK_LINE = { product_id:"", product:"", qty:"", unit:"sheets", unit_price:"" };
const INCOTERMS  = ["FOB Tg. Priok","CIF Shanghai","CIF Osaka","CIF Jebel Ali","CIF Busan","Ex-Works"];
const TERMS_LIST = ["NET 30","TT 30","TT 45","LC 60","LC 90","COD"];

export default function SalesOrders() {
  const [orders, setOrders] = useState(SALES_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customer_id:"", delivery_date:days_from_now(30), currency:"USD", incoterm:"FOB Tg. Priok", payment_terms:"LC 90", notes:"", lines:[{...BLANK_LINE}] });
  const [errors, setErrors] = useState({});

  const STATUSES = ["All","Draft","Confirmed","In Progress","Shipped"];
  const enriched = orders.map(o=>({...o, customer:CUSTOMERS.find(c=>c.id===o.customer_id)}));
  const filtered = enriched
    .filter(o=>statusFilter==="All"||o.status===statusFilter)
    .filter(o=>o.so_no.toLowerCase().includes(search.toLowerCase())||o.customer?.name.toLowerCase().includes(search.toLowerCase()));

  const setField=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));
  const setLine=(i,k)=>(e)=>{
    const lines=[...form.lines]; lines[i]={...lines[i],[k]:e.target.value};
    if(k==="product_id"){
      const p=PRODUCTS.find(p=>p.id===e.target.value);
      if(p){ lines[i].product=p.name; lines[i].unit=p.unit; lines[i].unit_price=form.currency==="USD"?(p.price_usd||""):p.price_idr||""; }
    }
    setForm(f=>({...f,lines}));
  };
  const addLine=()=>setForm(f=>({...f,lines:[...f.lines,{...BLANK_LINE}]}));
  const removeLine=(i)=>setForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}));

  const validate=()=>{
    const e={};
    if(!form.customer_id) e.customer_id="Pilih customer";
    if(!form.lines.some(l=>l.product&&l.qty&&l.unit_price)) e.lines="Minimal satu baris item harus diisi";
    return e;
  };

  const handleSubmit=(e)=>{
    e.preventDefault();
    const errs=validate();
    if(Object.keys(errs).length){setErrors(errs);return;}
    const lines=form.lines.filter(l=>l.product&&l.qty&&l.unit_price).map(l=>({
      id:`sl${Date.now()}${Math.random()}`,product_id:l.product_id,product:l.product,
      qty:Number(l.qty),unit:l.unit,unit_price:Number(l.unit_price),total:Number(l.qty)*Number(l.unit_price)
    }));
    const subtotal=lines.reduce((s,l)=>s+l.total,0);
    const total_idr=form.currency==="USD"?subtotal*15560:subtotal;
    const newSO={
      id:`so${Date.now()}`,
      so_no:`SO-2026-${String(orders.length+145).padStart(4,"0")}`,
      customer_id:form.customer_id, date:TODAY(), delivery_date:form.delivery_date,
      status:"Draft", currency:form.currency, incoterm:form.incoterm,
      payment_terms:form.payment_terms, subtotal, total:subtotal, total_idr, notes:form.notes, lines,
    };
    setOrders(os=>[newSO,...os]);
    setShowForm(false);
    toast(`${newSO.so_no} berhasil dibuat ✅`);
  };

  const changeStatus=(so,newStatus)=>{
    setOrders(os=>os.map(o=>o.id===so.id?{...o,status:newStatus}:o));
    setSelected(null);
    toast(`Status order diubah ke "${newStatus}" ✅`);
  };

  return (
    <div>
      <PageHeader title="Order Penjualan (Sales Orders)" subtitle={`${orders.length} order · ${orders.filter(o=>o.status!=="Shipped").length} aktif`}
        actions={<><Btn variant="secondary" onClick={()=>exportCSV(orders,"sales-orders.csv")}>📤 Export</Btn><Btn onClick={()=>{setForm({customer_id:"",delivery_date:days_from_now(30),currency:"USD",incoterm:"FOB Tg. Priok",payment_terms:"LC 90",notes:"",lines:[{...BLANK_LINE}]});setErrors({});setShowForm(true);}}>+ Buat SO Baru</Btn></>} />

      {/* Status pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${statusFilter===s?"bg-blue-600 text-white":"bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            {s} <span className="opacity-60">{s==="All"?orders.length:orders.filter(o=>o.status===s).length}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Cari nomor SO, customer…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"so_no",    label:"Nomor SO",    render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"customer", label:"Customer",    render:v=>v?.name.split(" ").slice(0,3).join(" ")||"—" },
          { key:"date",     label:"Tgl. Buat",   render:DATE },
          { key:"delivery_date",label:"Tgl. Kirim",render:DATE },
          { key:"incoterm", label:"Incoterm"     },
          { key:"total",    label:"Nilai",       right:true, render:(v,r)=><span className="font-bold">{r.currency} {v.toLocaleString()}</span> },
          { key:"status",   label:"Status",      render:v=><Badge status={v} /> },
        ]} data={filtered} empty="Belum ada order — klik '+ Buat SO Baru'" />
      </Card>

      {/* Detail */}
      {selected && (
        <Modal title={selected.so_no} subtitle={selected.customer?.name} onClose={()=>setSelected(null)} width="max-w-3xl">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[["Customer",selected.customer?.name],["Tgl. Dibuat",DATE(selected.date)],["Tgl. Kirim",DATE(selected.delivery_date)],
                ["Incoterm",selected.incoterm],["Terms Bayar",selected.payment_terms],["Mata Uang",selected.currency],
                ["Status",selected.status],["Catatan",selected.notes||"—"]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rincian Barang</p>
              <table className="erp-table">
                <thead><tr><th>Produk</th><th>Qty</th><th className="text-right">Harga</th><th className="text-right">Total</th></tr></thead>
                <tbody>{selected.lines.map(l=>(
                  <tr key={l.id}><td>{l.product}</td><td>{l.qty.toLocaleString()} {l.unit}</td>
                    <td className="text-right">{selected.currency} {l.unit_price.toFixed(2)}</td>
                    <td className="text-right font-bold">{selected.currency} {l.total.toLocaleString()}</td></tr>
                ))}</tbody>
                <tfoot><tr className="font-black text-white"><td colSpan={3} className="text-right px-4 py-2">TOTAL</td>
                  <td className="text-right px-4 py-2">{selected.currency} {selected.total.toLocaleString()}</td></tr></tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2 flex-wrap">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              {selected.status==="Draft" && <Btn variant="success" onClick={()=>changeStatus(selected,"Confirmed")}>✅ Konfirmasi Order</Btn>}
              {selected.status==="Confirmed" && <Btn onClick={()=>changeStatus(selected,"In Progress")}>⚙️ Mulai Proses</Btn>}
              {selected.status==="In Progress" && <Btn onClick={()=>changeStatus(selected,"Shipped")}>🚢 Tandai Dikirim</Btn>}
              <Btn variant="secondary" onClick={()=>toast("Proforma Invoice dibuat 📋")}>📋 Buat Proforma</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* New SO form */}
      {showForm && (
        <Modal title="Buat Sales Order Baru" onClose={()=>setShowForm(false)} width="max-w-2xl">
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Customer" required>
                <select value={form.customer_id} onChange={setField("customer_id")} className={`erp-select ${errors.customer_id?"border-red-500":""}`}>
                  <option value="">— Pilih Customer —</option>
                  {CUSTOMERS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {errors.customer_id && <p className="text-xs text-red-400 mt-1">{errors.customer_id}</p>}
              </FormField>
              <FormField label="Tanggal Pengiriman">
                <input type="date" value={form.delivery_date} onChange={setField("delivery_date")} className="erp-input" />
              </FormField>
              <FormField label="Mata Uang">
                <select value={form.currency} onChange={setField("currency")} className="erp-select">
                  <option>USD</option><option>IDR</option>
                </select>
              </FormField>
              <FormField label="Incoterm">
                <select value={form.incoterm} onChange={setField("incoterm")} className="erp-select">
                  {INCOTERMS.map(t=><option key={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Terms Pembayaran">
                <select value={form.payment_terms} onChange={setField("payment_terms")} className="erp-select">
                  {TERMS_LIST.map(t=><option key={t}>{t}</option>)}
                </select>
              </FormField>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-300">Daftar Barang</p>
                <Btn size="xs" variant="secondary" type="button" onClick={addLine}>+ Tambah Baris</Btn>
              </div>
              {errors.lines && <p className="text-xs text-red-400 mb-2">{errors.lines}</p>}
              <div className="space-y-2">
                {form.lines.map((line,i)=>(
                  <div key={i} className="bg-gray-800/40 rounded-xl p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <p className="erp-label">Produk</p>
                        <select value={line.product_id} onChange={setLine(i,"product_id")} className="erp-select">
                          <option value="">— Pilih produk —</option>
                          {PRODUCTS.filter(p=>p.category!=="Raw Material"&&p.category!=="Chemical").map(p=>(
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="custom">— Input manual —</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <p className="erp-label">Qty</p>
                        <input type="number" value={line.qty} onChange={setLine(i,"qty")} className="erp-input" placeholder="0" />
                      </div>
                      <div className="col-span-1">
                        <p className="erp-label">Satuan</p>
                        <input value={line.unit} onChange={setLine(i,"unit")} className="erp-input" />
                      </div>
                      <div className="col-span-3">
                        <p className="erp-label">Harga ({form.currency})</p>
                        <input type="number" step="0.01" value={line.unit_price} onChange={setLine(i,"unit_price")} className="erp-input" placeholder="0.00" />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {form.lines.length>1 && <button type="button" onClick={()=>removeLine(i)} className="text-red-400 hover:text-red-300 text-xl">×</button>}
                      </div>
                    </div>
                    {line.qty&&line.unit_price&&(
                      <p className="text-right text-xs text-gray-400">
                        Subtotal: <span className="font-bold text-white">{form.currency} {(Number(line.qty)*Number(line.unit_price)).toLocaleString()}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {form.lines.some(l=>l.qty&&l.unit_price)&&(
                <div className="text-right mt-2 font-black text-white">
                  Total: {form.currency} {form.lines.reduce((s,l)=>s+(Number(l.qty)||0)*(Number(l.unit_price)||0),0).toLocaleString()}
                </div>
              )}
            </div>

            <FormField label="Catatan">
              <textarea value={form.notes} onChange={setField("notes")} className="erp-input h-16 resize-none" placeholder="No. L/C, catatan khusus…" />
            </FormField>
            <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">✅ Buat Sales Order</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
