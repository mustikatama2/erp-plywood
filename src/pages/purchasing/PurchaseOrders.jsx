import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, DATE, days_from_now, TODAY } from "../../lib/fmt";
import { PURCHASE_ORDERS, VENDORS, PRODUCTS } from "../../data/seed";

const BLANK_LINE = { product:"", qty:"", unit:"pcs", unit_price:"" };

export default function PurchaseOrders() {
  const [orders, setOrders] = useState(PURCHASE_ORDERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vendor_id:"", delivery_date:days_from_now(14), notes:"", lines:[{...BLANK_LINE}] });
  const [errors, setErrors] = useState({});

  const enriched = orders.map(po=>({...po, vendor:VENDORS.find(v=>v.id===po.vendor_id)}));
  const filtered = enriched.filter(po=>
    po.po_no.toLowerCase().includes(search.toLowerCase()) ||
    po.vendor?.name.toLowerCase().includes(search.toLowerCase())
  );

  const setField = (k) => (e) => setForm(f=>({...f,[k]:e.target.value}));
  const setLine = (i,k) => (e) => {
    const lines = [...form.lines];
    lines[i] = {...lines[i],[k]:e.target.value};
    setForm(f=>({...f,lines}));
  };
  const addLine = () => setForm(f=>({...f,lines:[...f.lines,{...BLANK_LINE}]}));
  const removeLine = (i) => setForm(f=>({...f,lines:f.lines.filter((_,j)=>j!==i)}));

  const validate = () => {
    const e={};
    if(!form.vendor_id) e.vendor_id="Pilih vendor";
    if(!form.lines.some(l=>l.product&&l.qty&&l.unit_price)) e.lines="Minimal satu baris item harus diisi lengkap";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs=validate();
    if(Object.keys(errs).length){setErrors(errs);return;}
    const lines = form.lines.filter(l=>l.product&&l.qty&&l.unit_price).map(l=>({
      product:l.product, qty:Number(l.qty), unit:l.unit,
      unit_price:Number(l.unit_price), total:Number(l.qty)*Number(l.unit_price)
    }));
    const total = lines.reduce((s,l)=>s+l.total,0);
    const newPO = {
      id:`po${Date.now()}`,
      po_no:`PO-2026-${String(orders.length+325).padStart(4,"0")}`,
      vendor_id:form.vendor_id,
      date:TODAY(),
      delivery_date:form.delivery_date,
      status:"Draft",
      total,
      notes:form.notes,
      lines,
    };
    setOrders(os=>[newPO,...os]);
    setShowForm(false);
    toast(`${newPO.po_no} berhasil dibuat ✅`);
  };

  return (
    <div>
      <PageHeader title="Order Pembelian (PO)" subtitle={`${orders.length} order`}
        actions={<Btn onClick={()=>{setForm({vendor_id:"",delivery_date:days_from_now(14),notes:"",lines:[{...BLANK_LINE}]});setErrors({});setShowForm(true);}}>+ Buat PO Baru</Btn>} />
      <Card>
        <div className="mb-4"><SearchBar value={search} onChange={setSearch} placeholder="Cari nomor PO, vendor…" /></div>
        <Table onRowClick={setSelected} columns={[
          { key:"po_no",  label:"Nomor PO",   render:v=><span className="font-mono font-bold text-blue-400">{v}</span> },
          { key:"vendor", label:"Vendor",     render:v=>v?.name },
          { key:"date",   label:"Tgl. Buat",  render:DATE },
          { key:"delivery_date",label:"Tgl. Kirim",render:DATE },
          { key:"total",  label:"Total",      right:true, render:v=><span className="font-bold">{IDR(v)}</span> },
          { key:"status", label:"Status",     render:v=><Badge status={v} /> },
        ]} data={filtered} />
      </Card>

      {selected && (
        <Modal title={selected.po_no} subtitle={selected.vendor?.name} onClose={()=>setSelected(null)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[["Vendor",selected.vendor?.name],["Tgl. Dibuat",DATE(selected.date)],
                ["Tgl. Pengiriman",DATE(selected.delivery_date)],["Status",selected.status]].map(([k,v])=>(
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-white">{v}</p></div>
              ))}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Item Pesanan</p>
              <table className="erp-table">
                <thead><tr><th>Produk</th><th>Qty</th><th className="text-right">Harga Satuan</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {selected.lines.map((l,i)=>(
                    <tr key={i}><td>{l.product}</td><td>{l.qty.toLocaleString()} {l.unit}</td>
                      <td className="text-right">{IDR(l.unit_price)}</td>
                      <td className="text-right font-bold">{IDR(l.total)}</td></tr>
                  ))}
                </tbody>
                <tfoot><tr className="font-black text-white">
                  <td colSpan={3} className="text-right px-4 py-2">Total</td>
                  <td className="text-right px-4 py-2">{IDR(selected.total)}</td>
                </tr></tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              <Btn variant="success" onClick={()=>{
                setOrders(os=>os.map(o=>o.id===selected.id?{...o,status:"Received"}:o));
                setSelected(null); toast("Barang ditandai sudah diterima 📦");
              }}>📦 Terima Barang</Btn>
              <Btn onClick={()=>{
                setOrders(os=>os.map(o=>o.id===selected.id?{...o,status:"Confirmed"}:o));
                setSelected(null); toast("PO disetujui ✅");
              }}>✅ Setujui</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showForm && (
        <Modal title="Buat Purchase Order Baru" onClose={()=>setShowForm(false)} width="max-w-2xl">
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Vendor" required>
                <select value={form.vendor_id} onChange={setField("vendor_id")} className={`erp-select ${errors.vendor_id?"border-red-500":""}`}>
                  <option value="">— Pilih Vendor —</option>
                  {VENDORS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                {errors.vendor_id && <p className="text-xs text-red-400 mt-1">{errors.vendor_id}</p>}
              </FormField>
              <FormField label="Tanggal Pengiriman Diharapkan">
                <input type="date" value={form.delivery_date} onChange={setField("delivery_date")} className="erp-input" />
              </FormField>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-300">Item Pesanan</p>
                <Btn size="xs" variant="secondary" type="button" onClick={addLine}>+ Tambah Baris</Btn>
              </div>
              {errors.lines && <p className="text-xs text-red-400 mb-2">{errors.lines}</p>}
              <div className="space-y-2">
                {form.lines.map((line,i)=>(
                  <div key={i} className="grid grid-cols-12 gap-2 items-start bg-gray-800/40 rounded-xl p-3">
                    <div className="col-span-4">
                      <p className="erp-label">Nama Barang</p>
                      <input value={line.product} onChange={setLine(i,"product")} className="erp-input" placeholder="Nama produk/bahan" />
                    </div>
                    <div className="col-span-2">
                      <p className="erp-label">Qty</p>
                      <input type="number" value={line.qty} onChange={setLine(i,"qty")} className="erp-input" placeholder="0" />
                    </div>
                    <div className="col-span-2">
                      <p className="erp-label">Satuan</p>
                      <input value={line.unit} onChange={setLine(i,"unit")} className="erp-input" placeholder="m3" />
                    </div>
                    <div className="col-span-3">
                      <p className="erp-label">Harga Satuan</p>
                      <input type="number" value={line.unit_price} onChange={setLine(i,"unit_price")} className="erp-input" placeholder="0" />
                    </div>
                    <div className="col-span-1 pt-5">
                      {form.lines.length>1 && (
                        <button type="button" onClick={()=>removeLine(i)} className="text-red-400 hover:text-red-300 text-lg">×</button>
                      )}
                    </div>
                    {line.qty&&line.unit_price&&(
                      <div className="col-span-12 text-right text-xs text-gray-400">
                        Subtotal: <span className="font-bold text-white">{IDR(Number(line.qty)*Number(line.unit_price))}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {form.lines.some(l=>l.qty&&l.unit_price)&&(
                <div className="flex justify-end mt-2 text-sm font-black text-white">
                  Total: {IDR(form.lines.reduce((s,l)=>s+(Number(l.qty)||0)*(Number(l.unit_price)||0),0))}
                </div>
              )}
            </div>

            <FormField label="Catatan (opsional)">
              <textarea value={form.notes} onChange={setField("notes")} className="erp-input h-16 resize-none" placeholder="Catatan tambahan…" />
            </FormField>

            <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">✅ Buat Purchase Order</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
