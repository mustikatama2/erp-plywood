import { useState } from "react";
import { PageHeader, Card, Btn, Badge, SearchBar, Table, Modal, toast, FormField } from "../../components/ui";
import { IDR, DATE, days_from_now, TODAY } from "../../lib/fmt";
import { PURCHASE_ORDERS, VENDORS, PRODUCTS, COMPANY } from "../../data/seed";

// ── Print PO Modal ────────────────────────────────────────────────────────────
function PrintPOModal({ po, onClose }) {
  const vendor = po.vendor || VENDORS.find(v => v.id === po.vendor_id);

  const handlePrint = () => {
    document.title = `PO ${po.po_no}`;
    window.print();
    document.title = "Mustikatama ERP";
  };

  return (
    <Modal title={`Print Purchase Order — ${po.po_no}`} onClose={onClose} width="max-w-3xl">
      <div className="p-4">
        <div className="flex justify-end gap-2 mb-4 no-print">
          <Btn variant="secondary" onClick={onClose}>✕ Tutup</Btn>
          <Btn className="print-show" onClick={handlePrint}>🖨️ Print</Btn>
        </div>

        {/* A4 document */}
        <div className="print-doc print-area bg-white border border-gray-200 rounded-lg p-8">
          {/* Letterhead */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-800">
            <div>
              <h1 className="text-xl font-black text-gray-900" style={{fontFamily:"Georgia,serif"}}>
                PT. MUSTIKATAMA GRAHA PERSADA
              </h1>
              <p className="text-xs text-gray-600 mt-1">Jl. Industri Raya No. 12, Kawasan Industri, Bekasi 17520</p>
              <p className="text-xs text-gray-600">NPWP: 01.234.567.8-091.000</p>
              <p className="text-xs text-gray-600">Telp: (021) 8840-1234 · Email: purchasing@mustikatama.co.id</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">Document Type</div>
              <h2 className="text-2xl font-black text-gray-800 border-2 border-gray-800 px-3 py-1">PURCHASE ORDER</h2>
            </div>
          </div>

          {/* PO meta */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-1 text-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Vendor / Supplier</p>
              <p className="font-bold text-gray-900 text-base">{vendor?.name || "—"}</p>
              <p className="text-gray-700">{vendor?.country || vendor?.address || "—"}</p>
              {vendor?.contact_person && <p className="text-gray-600">Attn: {vendor.contact_person}</p>}
            </div>
            <div className="space-y-1 text-sm border-l border-gray-200 pl-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">PO Details</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Number:</span>
                  <span className="font-mono font-bold text-gray-900">{po.po_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Date:</span>
                  <span className="font-medium text-gray-900">{DATE(po.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery Date:</span>
                  <span className="font-medium text-gray-900">{DATE(po.delivery_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge status={po.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full text-sm mb-6 border border-gray-300">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wider">No.</th>
                <th className="text-left px-3 py-2 text-xs uppercase tracking-wider">Deskripsi / Produk</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Qty</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Satuan</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Harga Satuan</th>
                <th className="text-right px-3 py-2 text-xs uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {(po.lines || []).map((line, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="px-3 py-2 text-gray-600">{i + 1}</td>
                  <td className="px-3 py-2 text-gray-900">{line.product || "—"}</td>
                  <td className="px-3 py-2 text-right">{Number(line.qty).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{line.unit || "pcs"}</td>
                  <td className="px-3 py-2 text-right font-mono">{IDR(line.unit_price)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold">{IDR(line.total || (line.qty * line.unit_price))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-800 bg-gray-800 text-white">
                <td colSpan={5} className="px-3 py-2 text-right font-black uppercase tracking-wider text-sm">Total</td>
                <td className="px-3 py-2 text-right font-mono font-black text-base">{IDR(po.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Payment terms & notes */}
          <div className="grid grid-cols-2 gap-6 mt-4 text-sm border-t border-gray-200 pt-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Syarat Pembayaran / Payment Terms</p>
              <p className="text-gray-700">Net 30 hari sejak penerimaan barang</p>
              {po.notes && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Catatan</p>
                  <p className="text-gray-600 italic">{po.notes}</p>
                </div>
              )}
            </div>
            <div className="border-l border-gray-200 pl-6">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Pengiriman / Delivery</p>
              <p className="text-gray-700">Kirim ke: Gudang PT. Mustikatama Graha Persada</p>
              <p className="text-gray-700">Jl. Industri Raya No. 12, Bekasi 17520</p>
              <p className="text-gray-600 text-xs mt-1">Hubungi gudang sebelum pengiriman: (021) 8840-1235</p>
            </div>
          </div>

          {/* Signature block */}
          <div className="mt-8 grid grid-cols-2 gap-8 text-sm text-center">
            <div>
              <p className="text-xs text-gray-500 mb-8">Dibuat Oleh / Prepared By</p>
              <div className="border-t border-gray-800 pt-2">
                <p className="font-medium text-gray-800">Purchasing Dept.</p>
                <p className="text-xs text-gray-500">PT. Mustikatama Graha Persada</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-8">Disetujui Oleh / Approved By</p>
              <div className="border-t border-gray-800 pt-2">
                <p className="font-medium text-gray-800">Purchasing Manager</p>
                <p className="text-xs text-gray-500">PT. Mustikatama Graha Persada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

const BLANK_LINE = { product:"", qty:"", unit:"pcs", unit_price:"" };

export default function PurchaseOrders() {
  const [orders, setOrders] = useState(PURCHASE_ORDERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
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
          { key:"po_no",  label:"Nomor PO",   render:v=><span className="font-mono font-bold text-blue-700">{v}</span> },
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
                <div key={k}><p className="text-xs text-gray-500">{k}</p><p className="font-medium text-gray-900">{v}</p></div>
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
                <tfoot><tr className="font-black text-gray-900">
                  <td colSpan={3} className="text-right px-4 py-2">Total</td>
                  <td className="text-right px-4 py-2">{IDR(selected.total)}</td>
                </tr></tfoot>
              </table>
            </div>
            <div className="flex justify-end gap-2 flex-wrap">
              <Btn variant="secondary" onClick={()=>setSelected(null)}>Tutup</Btn>
              <Btn variant="secondary" onClick={()=>setShowPrint(true)}>🖨️ Print PO</Btn>
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

      {showPrint && selected && (
        <PrintPOModal
          po={{ ...selected, vendor: VENDORS.find(v => v.id === selected.vendor_id) }}
          onClose={() => setShowPrint(false)}
        />
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
                {errors.vendor_id && <p className="text-xs text-red-700 mt-1">{errors.vendor_id}</p>}
              </FormField>
              <FormField label="Tanggal Pengiriman Diharapkan">
                <input type="date" value={form.delivery_date} onChange={setField("delivery_date")} className="erp-input" />
              </FormField>
            </div>

            {/* Lines */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700">Item Pesanan</p>
                <Btn size="xs" variant="secondary" type="button" onClick={addLine}>+ Tambah Baris</Btn>
              </div>
              {errors.lines && <p className="text-xs text-red-700 mb-2">{errors.lines}</p>}
              <div className="space-y-2">
                {form.lines.map((line,i)=>(
                  <div key={i} className="grid grid-cols-12 gap-2 items-start bg-gray-50 rounded-xl p-3">
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
                        <button type="button" onClick={()=>removeLine(i)} className="text-red-700 hover:text-red-300 text-lg">×</button>
                      )}
                    </div>
                    {line.qty&&line.unit_price&&(
                      <div className="col-span-12 text-right text-xs text-gray-400">
                        Subtotal: <span className="font-bold text-gray-900">{IDR(Number(line.qty)*Number(line.unit_price))}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {form.lines.some(l=>l.qty&&l.unit_price)&&(
                <div className="flex justify-end mt-2 text-sm font-black text-gray-900">
                  Total: {IDR(form.lines.reduce((s,l)=>s+(Number(l.qty)||0)*(Number(l.unit_price)||0),0))}
                </div>
              )}
            </div>

            <FormField label="Catatan (opsional)">
              <textarea value={form.notes} onChange={setField("notes")} className="erp-input h-16 resize-none" placeholder="Catatan tambahan…" />
            </FormField>

            <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
              <Btn variant="secondary" type="button" onClick={()=>setShowForm(false)}>Batal</Btn>
              <Btn type="submit">✅ Buat Purchase Order</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
