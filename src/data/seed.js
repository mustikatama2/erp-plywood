import { days_ago, days_from_now, TODAY } from "../lib/fmt";

// ── Company ──────────────────────────────────────────────────────────────────
export const COMPANY = {
  name: "PT. Mustikatama Graha Persada",
  short: "Mustikatama",
  address: "Jl. Industri Raya No. 12, Kawasan Industri, Bekasi 17520",
  npwp: "01.234.567.8-091.000",
  currency: "IDR",
  fiscal_year_start: "01-01",
};

// ── Chart of Accounts ─────────────────────────────────────────────────────────
export const ACCOUNTS = [
  // Assets
  { id:"1000", code:"1000", name:"Current Assets",       type:"asset",   is_header:true  },
  { id:"1100", code:"1100", name:"Cash on Hand",         type:"asset",   parent:"1000", normal:"debit" },
  { id:"1110", code:"1110", name:"Bank BCA - IDR",       type:"asset",   parent:"1000", normal:"debit" },
  { id:"1120", code:"1120", name:"Bank Mandiri - IDR",   type:"asset",   parent:"1000", normal:"debit" },
  { id:"1130", code:"1130", name:"Bank BCA - USD",       type:"asset",   parent:"1000", normal:"debit" },
  { id:"1200", code:"1200", name:"Accounts Receivable",  type:"asset",   parent:"1000", normal:"debit" },
  { id:"1210", code:"1210", name:"Other Receivables",    type:"asset",   parent:"1000", normal:"debit" },
  { id:"1300", code:"1300", name:"Inventory - Raw Material",type:"asset",parent:"1000", normal:"debit" },
  { id:"1310", code:"1310", name:"Inventory - WIP",      type:"asset",   parent:"1000", normal:"debit" },
  { id:"1320", code:"1320", name:"Inventory - Finished Goods",type:"asset",parent:"1000",normal:"debit"},
  { id:"1400", code:"1400", name:"Prepaid Expenses",     type:"asset",   parent:"1000", normal:"debit" },
  { id:"1500", code:"1500", name:"Fixed Assets",         type:"asset",   is_header:true  },
  { id:"1510", code:"1510", name:"Land & Building",      type:"asset",   parent:"1500", normal:"debit" },
  { id:"1520", code:"1520", name:"Machinery & Equipment",type:"asset",   parent:"1500", normal:"debit" },
  { id:"1530", code:"1530", name:"Vehicles",             type:"asset",   parent:"1500", normal:"debit" },
  { id:"1590", code:"1590", name:"Accum. Depreciation",  type:"asset",   parent:"1500", normal:"credit"},
  // Liabilities
  { id:"2000", code:"2000", name:"Current Liabilities",  type:"liability",is_header:true },
  { id:"2100", code:"2100", name:"Accounts Payable",     type:"liability",parent:"2000", normal:"credit"},
  { id:"2200", code:"2200", name:"Accrued Liabilities",  type:"liability",parent:"2000", normal:"credit"},
  { id:"2300", code:"2300", name:"Tax Payable - PPN",    type:"liability",parent:"2000", normal:"credit"},
  { id:"2310", code:"2310", name:"Tax Payable - PPh",    type:"liability",parent:"2000", normal:"credit"},
  { id:"2400", code:"2400", name:"Short-term Loans",     type:"liability",parent:"2000", normal:"credit"},
  { id:"2500", code:"2500", name:"Long-term Liabilities",type:"liability",is_header:true },
  { id:"2510", code:"2510", name:"Bank Loans",           type:"liability",parent:"2500", normal:"credit"},
  // Equity
  { id:"3000", code:"3000", name:"Equity",               type:"equity",   is_header:true },
  { id:"3100", code:"3100", name:"Paid-in Capital",      type:"equity",   parent:"3000", normal:"credit"},
  { id:"3200", code:"3200", name:"Retained Earnings",    type:"equity",   parent:"3000", normal:"credit"},
  { id:"3300", code:"3300", name:"Current Year Earnings",type:"equity",   parent:"3000", normal:"credit"},
  // Revenue
  { id:"4000", code:"4000", name:"Revenue",              type:"revenue",  is_header:true },
  { id:"4100", code:"4100", name:"Sales - Plywood Export",type:"revenue", parent:"4000", normal:"credit"},
  { id:"4110", code:"4110", name:"Sales - Domestic",     type:"revenue",  parent:"4000", normal:"credit"},
  { id:"4200", code:"4200", name:"Other Income",         type:"revenue",  parent:"4000", normal:"credit"},
  // COGS
  { id:"5000", code:"5000", name:"Cost of Goods Sold",   type:"expense",  is_header:true },
  { id:"5100", code:"5100", name:"Raw Material Cost",    type:"expense",  parent:"5000", normal:"debit" },
  { id:"5200", code:"5200", name:"Direct Labor Cost",    type:"expense",  parent:"5000", normal:"debit" },
  { id:"5300", code:"5300", name:"Manufacturing OH",     type:"expense",  parent:"5000", normal:"debit" },
  // Operating Expenses
  { id:"6000", code:"6000", name:"Operating Expenses",   type:"expense",  is_header:true },
  { id:"6100", code:"6100", name:"Salaries & Wages",     type:"expense",  parent:"6000", normal:"debit" },
  { id:"6200", code:"6200", name:"Freight & Logistics",  type:"expense",  parent:"6000", normal:"debit" },
  { id:"6300", code:"6300", name:"Export Costs (SVLK,etc)",type:"expense",parent:"6000",normal:"debit" },
  { id:"6400", code:"6400", name:"Utilities",            type:"expense",  parent:"6000", normal:"debit" },
  { id:"6500", code:"6500", name:"Depreciation",         type:"expense",  parent:"6000", normal:"debit" },
  { id:"6600", code:"6600", name:"Bank Charges",         type:"expense",  parent:"6000", normal:"debit" },
  { id:"6700", code:"6700", name:"Office & Admin",       type:"expense",  parent:"6000", normal:"debit" },
  { id:"6800", code:"6800", name:"Marketing & Sales",    type:"expense",  parent:"6000", normal:"debit" },
  { id:"6900", code:"6900", name:"Interest Expense",     type:"expense",  parent:"6000", normal:"debit" },
];

// ── Customers ─────────────────────────────────────────────────────────────────
export const CUSTOMERS = [
  { id:"c1", code:"CUST-001", name:"Yamamoto Trading Co., Ltd.",    country:"Japan",       contact:"Kenji Yamamoto",  email:"kenji@yamamoto.jp",  phone:"+81-3-1234-5678", credit_limit:500000000, payment_terms:"LC 90", currency:"USD", ar_balance: 187500000, status:"Active" },
  { id:"c2", code:"CUST-002", name:"Shanghai Fuhua Import & Export",country:"China",       contact:"Li Wei",          email:"liwei@fuhua.cn",     phone:"+86-21-5555-0001", credit_limit:750000000, payment_terms:"TT 30",  currency:"USD", ar_balance: 312000000, status:"Active" },
  { id:"c3", code:"CUST-003", name:"Al Futtaim Building Materials", country:"UAE",         contact:"Ahmad Al-Rashid", email:"ahmad@alfuttaim.ae", phone:"+971-4-888-0001",  credit_limit:400000000, payment_terms:"LC 60",  currency:"USD", ar_balance: 98000000,  status:"Active" },
  { id:"c4", code:"CUST-004", name:"SungJin Korea Trading Co.",     country:"South Korea", contact:"Park Joon-ho",    email:"joonho@sungjin.kr",  phone:"+82-2-7777-0001",  credit_limit:300000000, payment_terms:"TT 30",  currency:"USD", ar_balance: 156000000, status:"Active" },
  { id:"c5", code:"CUST-005", name:"PT. Bangun Jaya Nusantara",     country:"Indonesia",   contact:"Budi Santoso",    email:"budi@bangunjaya.id", phone:"+62-21-6666-0001", credit_limit:200000000, payment_terms:"NET 30", currency:"IDR", ar_balance: 67000000,  status:"Active" },
  { id:"c6", code:"CUST-006", name:"Timber World Australia Pty Ltd",country:"Australia",   contact:"James Mitchell",  email:"j.mitchell@timberworld.au",phone:"+61-3-9001-2345",credit_limit:350000000, payment_terms:"TT 45",  currency:"USD", ar_balance: 0, status:"Active" },
];

// ── Vendors ───────────────────────────────────────────────────────────────────
export const VENDORS = [
  { id:"v1", code:"VEND-001", name:"PT. Rimba Kalimantan Lestari",  category:"Log Supplier",      contact:"H. Suryadi",   payment_terms:"NET 45", ap_balance: 285000000 },
  { id:"v2", code:"VEND-002", name:"PT. Kayu Nusantara Abadi",      category:"Veneer Supplier",   contact:"Darmawan",     payment_terms:"NET 30", ap_balance: 142000000 },
  { id:"v3", code:"VEND-003", name:"CV. Resin Kimia Abadi",         category:"Chemical/Glue",     contact:"Agus Prabowo", payment_terms:"NET 30", ap_balance: 58000000  },
  { id:"v4", code:"VEND-004", name:"PT. Listrik Mandiri",           category:"Utilities",         contact:"—",            payment_terms:"NET 15", ap_balance: 23000000  },
  { id:"v5", code:"VEND-005", name:"PT. Logistik Maju Indonesia",   category:"Freight & Shipping",contact:"Hendri",       payment_terms:"NET 30", ap_balance: 97000000  },
  { id:"v6", code:"VEND-006", name:"PT. Kertas & Percetakan Jaya",  category:"Packaging",         contact:"Susi",         payment_terms:"NET 30", ap_balance: 15000000  },
];

// ── Products ──────────────────────────────────────────────────────────────────
export const PRODUCTS = [
  { id:"p1", code:"PLY-1800", name:"Plywood 18mm Commercial", category:"Plywood", unit:"sheets", spec:"18mm × 1220×2440 / E1 / BB-CC", price_usd:8.50,  price_idr:132250, stock_qty:3420, reorder:500 },
  { id:"p2", code:"PLY-1200", name:"Plywood 12mm Commercial", category:"Plywood", unit:"sheets", spec:"12mm × 1220×2440 / E1 / BB-CC", price_usd:6.20,  price_idr:96420,  stock_qty:2180, reorder:500 },
  { id:"p3", code:"PLY-0900", name:"Plywood 9mm Commercial",  category:"Plywood", unit:"sheets", spec:"9mm × 1220×2440 / E1 / BB-CC",  price_usd:4.80,  price_idr:74640,  stock_qty:1890, reorder:400 },
  { id:"p4", code:"PLY-1800M",name:"Plywood 18mm Marine",    category:"Plywood", unit:"sheets", spec:"18mm × 1220×2440 / WBP / BB-BB", price_usd:12.50, price_idr:194375, stock_qty:680,  reorder:200 },
  { id:"p5", code:"PLY-0600", name:"Plywood 6mm Thin",       category:"Plywood", unit:"sheets", spec:"6mm × 1220×2440 / E1 / BB-CC",  price_usd:3.20,  price_idr:49760,  stock_qty:2750, reorder:600 },
  { id:"p6", code:"BBD-1800", name:"Blockboard 18mm",        category:"Blockboard",unit:"sheets",spec:"18mm × 1220×2440 / E1 / BB-CC", price_usd:7.80,  price_idr:121290, stock_qty:920,  reorder:200 },
  // Raw Materials
  { id:"r1", code:"LOG-MER",  name:"Log Meranti",            category:"Raw Material",unit:"m3", spec:"Meranti / Grade A / Dia 30cm+", price_usd:null,  price_idr:950000, stock_qty:285,  reorder:100 },
  { id:"r2", code:"GLU-UF",   name:"UF Glue Resin",          category:"Chemical",   unit:"kg",  spec:"Urea Formaldehyde / E1 grade",  price_usd:null,  price_idr:12500,  stock_qty:4200, reorder:1000 },
  { id:"r3", code:"HRD-NH4",  name:"Hardener NH4Cl",         category:"Chemical",   unit:"kg",  spec:"Ammonium Chloride",             price_usd:null,  price_idr:8500,   stock_qty:850,  reorder:200 },
];

// ── Warehouses / Locations ────────────────────────────────────────────────────
export const WAREHOUSES = [
  { id:"wh1", code:"WH-MAIN",  name:"Main Warehouse — Bekasi",    locations:["Log Yard","Veneer Storage","Glue Room","FG Area A","FG Area B"] },
  { id:"wh2", code:"WH-PORT",  name:"Port Warehouse — Tanjung Priok", locations:["Container Staging","Inspection Area"] },
];

// ── Sales Orders ──────────────────────────────────────────────────────────────
export const SALES_ORDERS = [
  { id:"so1", so_no:"SO-2026-0142", customer_id:"c1", date:days_ago(12), delivery_date:days_from_now(18), status:"Confirmed", currency:"USD", incoterm:"FOB Tg. Priok", payment_terms:"LC 90", subtotal:42500, tax:0, total:42500, total_idr:661250000, notes:"L/C No. YTC-2026-0891",
    lines:[{id:"sl1",product_id:"p1",product:"Plywood 18mm Commercial",qty:3000,unit:"sheets",unit_price:8.50,total:25500},
           {id:"sl2",product_id:"p2",product:"Plywood 12mm Commercial",qty:2000,unit:"sheets",unit_price:6.20,total:12400},
           {id:"sl3",product_id:"p5",product:"Plywood 6mm Thin",       qty:1500,unit:"sheets",unit_price:3.20,total:4800}]},
  { id:"so2", so_no:"SO-2026-0143", customer_id:"c2", date:days_ago(8),  delivery_date:days_from_now(22), status:"In Progress", currency:"USD", incoterm:"CIF Shanghai", payment_terms:"TT 30", subtotal:78000, tax:0, total:78000, total_idr:1213740000, notes:"Container: 2×40HQ",
    lines:[{id:"sl4",product_id:"p1",product:"Plywood 18mm Commercial",qty:5000,unit:"sheets",unit_price:8.50,total:42500},
           {id:"sl5",product_id:"p4",product:"Plywood 18mm Marine",   qty:2000,unit:"sheets",unit_price:12.50,total:25000},
           {id:"sl6",product_id:"p6",product:"Blockboard 18mm",       qty:1350,unit:"sheets",unit_price:7.80,total:10530}]},
  { id:"so3", so_no:"SO-2026-0141", customer_id:"c3", date:days_ago(25), delivery_date:days_ago(3),       status:"Shipped",     currency:"USD", incoterm:"FOB Tg. Priok", payment_terms:"LC 60", subtotal:32500, tax:0, total:32500, total_idr:505425000, notes:"Vessel: MV Star Pioneer",
    lines:[{id:"sl7",product_id:"p1",product:"Plywood 18mm Commercial",qty:2000,unit:"sheets",unit_price:8.50,total:17000},
           {id:"sl8",product_id:"p3",product:"Plywood 9mm Commercial", qty:3200,unit:"sheets",unit_price:4.80,total:15360}]},
  { id:"so4", so_no:"SO-2026-0144", customer_id:"c5", date:days_ago(5),  delivery_date:days_from_now(10), status:"Confirmed",   currency:"IDR", incoterm:"Ex-Works",     payment_terms:"NET 30",subtotal:152250000,tax:15225000,total:167475000, total_idr:167475000, notes:"PO No. BJ/2026/0234",
    lines:[{id:"sl9",product_id:"p2",product:"Plywood 12mm Commercial",qty:1000,unit:"sheets",unit_price:96420,total:96420000},
           {id:"sl10",product_id:"p3",product:"Plywood 9mm Commercial",qty:600,unit:"sheets",unit_price:74640,total:44784000}]},
  { id:"so5", so_no:"SO-2026-0145", customer_id:"c4", date:days_ago(2),  delivery_date:days_from_now(30), status:"Draft",       currency:"USD", incoterm:"FOB Tg. Priok", payment_terms:"TT 30", subtotal:55000, tax:0, total:55000, total_idr:855425000, notes:"Awaiting buyer confirmation",
    lines:[{id:"sl11",product_id:"p1",product:"Plywood 18mm Commercial",qty:4000,unit:"sheets",unit_price:8.50,total:34000},
           {id:"sl12",product_id:"p4",product:"Plywood 18mm Marine",   qty:1680,unit:"sheets",unit_price:12.50,total:21000}]},
];

// ── Proforma Invoices ─────────────────────────────────────────────────────────
export const PROFORMAS = [
  { id:"pi1", pi_no:"PI-2026-0089", so_id:"so1", customer_id:"c1", date:days_ago(11), valid_until:days_from_now(30), status:"Accepted", currency:"USD", total:42500, bank_details:"BCA USD — SWIFT: CENAIDJA", payment_terms:"LC 90 days", notes:"L/C draft issued" },
  { id:"pi2", pi_no:"PI-2026-0090", so_id:"so2", customer_id:"c2", date:days_ago(7),  valid_until:days_from_now(30), status:"Sent",     currency:"USD", total:78000, bank_details:"BCA USD — SWIFT: CENAIDJA", payment_terms:"TT 30 days", notes:"" },
  { id:"pi3", pi_no:"PI-2026-0088", so_id:"so3", customer_id:"c3", date:days_ago(24), valid_until:days_ago(3),       status:"Accepted", currency:"USD", total:32500, bank_details:"Mandiri USD — SWIFT: BMRIIDJA", payment_terms:"LC 60 days", notes:"Shipped — Invoice issued" },
  { id:"pi4", pi_no:"PI-2026-0091", so_id:"so5", customer_id:"c4", date:days_ago(1),  valid_until:days_from_now(14), status:"Draft",    currency:"USD", total:55000, bank_details:"BCA USD — SWIFT: CENAIDJA", payment_terms:"TT 30 days", notes:"" },
];

// ── AR Invoices ───────────────────────────────────────────────────────────────
export const AR_INVOICES = [
  { id:"inv1", inv_no:"INV-2026-0201", so_id:"so3", customer_id:"c1", date:days_ago(20), due_date:days_from_now(70), status:"Unpaid",  currency:"USD", subtotal:42500, tax:0, total:42500, total_idr:661250000, paid:0, balance:42500  },
  { id:"inv2", inv_no:"INV-2026-0198", so_id:"so3", customer_id:"c3", date:days_ago(3),  due_date:days_from_now(57), status:"Unpaid",  currency:"USD", subtotal:32500, tax:0, total:32500, total_idr:505425000, paid:0, balance:32500  },
  { id:"inv3", inv_no:"INV-2026-0185", so_id:null,  customer_id:"c2", date:days_ago(35), due_date:days_ago(5),       status:"Overdue", currency:"USD", subtotal:65000, tax:0, total:65000, total_idr:1011250000,paid:0, balance:65000  },
  { id:"inv4", inv_no:"INV-2026-0180", so_id:null,  customer_id:"c4", date:days_ago(40), due_date:days_ago(10),      status:"Partial", currency:"USD", subtotal:48000, tax:0, total:48000, total_idr:746880000, paid:24000, balance:24000 },
  { id:"inv5", inv_no:"INV-2026-0175", so_id:null,  customer_id:"c5", date:days_ago(45), due_date:days_ago(15),      status:"Paid",    currency:"IDR", subtotal:120000000,tax:12000000,total:132000000,total_idr:132000000,paid:132000000,balance:0 },
];

// ── AP Invoices ───────────────────────────────────────────────────────────────
export const AP_INVOICES = [
  { id:"ap1", inv_no:"SINV-2026-0451", vendor_id:"v1", date:days_ago(10), due_date:days_from_now(35), status:"Unpaid",  description:"Log Meranti supply — 80m3", total:76000000,  paid:0,         balance:76000000  },
  { id:"ap2", inv_no:"SINV-2026-0449", vendor_id:"v1", date:days_ago(18), due_date:days_from_now(27), status:"Unpaid",  description:"Log Meranti supply — 65m3", total:61750000,  paid:0,         balance:61750000  },
  { id:"ap3", inv_no:"SINV-2026-0388", vendor_id:"v2", date:days_ago(8),  due_date:days_from_now(22), status:"Unpaid",  description:"Veneer face supply",        total:42000000,  paid:0,         balance:42000000  },
  { id:"ap4", inv_no:"SINV-2026-0360", vendor_id:"v3", date:days_ago(5),  due_date:days_from_now(25), status:"Unpaid",  description:"UF Resin & Hardener",       total:18500000,  paid:0,         balance:18500000  },
  { id:"ap5", inv_no:"SINV-2026-0290", vendor_id:"v5", date:days_ago(22), due_date:days_ago(7),       status:"Overdue", description:"Freight — MV Star Pioneer", total:28500000,  paid:0,         balance:28500000  },
  { id:"ap6", inv_no:"SINV-2026-0285", vendor_id:"v4", date:days_ago(30), due_date:days_ago(15),      status:"Paid",    description:"Electricity Jan 2026",      total:23000000,  paid:23000000,  balance:0         },
];

// ── Purchase Orders ───────────────────────────────────────────────────────────
export const PURCHASE_ORDERS = [
  { id:"po1", po_no:"PO-2026-0321", vendor_id:"v1", date:days_ago(12), delivery_date:days_from_now(18), status:"Received",    total:76000000,  lines:[{product:"Log Meranti",qty:80,unit:"m3",unit_price:950000,total:76000000}] },
  { id:"po2", po_no:"PO-2026-0322", vendor_id:"v2", date:days_ago(8),  delivery_date:days_from_now(12), status:"In Progress", total:42000000,  lines:[{product:"Veneer Face",qty:5000,unit:"sheets",unit_price:8400,total:42000000}] },
  { id:"po3", po_no:"PO-2026-0323", vendor_id:"v3", date:days_ago(5),  delivery_date:days_from_now(10), status:"Confirmed",   total:18500000,  lines:[{product:"UF Resin",qty:1200,unit:"kg",unit_price:12500,total:15000000},{product:"Hardener",qty:412,unit:"kg",unit_price:8500,total:3502000}] },
  { id:"po4", po_no:"PO-2026-0324", vendor_id:"v1", date:days_ago(2),  delivery_date:days_from_now(28), status:"Draft",       total:95000000,  lines:[{product:"Log Meranti",qty:100,unit:"m3",unit_price:950000,total:95000000}] },
];

// ── Bank Accounts ─────────────────────────────────────────────────────────────
export const BANK_ACCOUNTS = [
  { id:"bk1", account_id:"1110", name:"BCA — IDR Operasional", bank:"Bank Central Asia", no:"1234567890", currency:"IDR", balance:1245000000 },
  { id:"bk2", account_id:"1120", name:"Mandiri — IDR Payroll",  bank:"Bank Mandiri",      no:"0987654321", currency:"IDR", balance:385000000  },
  { id:"bk3", account_id:"1130", name:"BCA — USD Export",       bank:"Bank Central Asia", no:"1234567899", currency:"USD", balance:234500,     balance_idr:3647025000 },
];

// ── HR / Employees ────────────────────────────────────────────────────────────
export const EMPLOYEES = [
  { id:"e1", emp_no:"EMP-001", name:"Ridho Iskandar",     dept:"Management",    position:"Director",             hire_date:"2015-01-01", salary:25000000, status:"Active" },
  { id:"e2", emp_no:"EMP-012", name:"Sari Dewi",           dept:"Finance",       position:"Finance Manager",      hire_date:"2017-03-15", salary:12000000, status:"Active" },
  { id:"e3", emp_no:"EMP-025", name:"Budi Santoso",        dept:"Sales",         position:"Export Sales Manager", hire_date:"2018-06-01", salary:10000000, status:"Active" },
  { id:"e4", emp_no:"EMP-031", name:"Ahmad Fauzi",         dept:"Production",    position:"Plant Manager",        hire_date:"2016-08-20", salary:11000000, status:"Active" },
  { id:"e5", emp_no:"EMP-048", name:"Rini Setiawati",      dept:"HR",            position:"HR Officer",           hire_date:"2020-01-10", salary:6500000,  status:"Active" },
  { id:"e6", emp_no:"EMP-062", name:"Doni Kurniawan",      dept:"Warehouse",     position:"Warehouse Supervisor", hire_date:"2019-05-05", salary:7000000,  status:"Active" },
  { id:"e7", emp_no:"EMP-089", name:"Wahyu Prasetyo",      dept:"Production",    position:"Machine Operator",     hire_date:"2021-02-28", salary:4500000,  status:"Active" },
  { id:"e8", emp_no:"EMP-095", name:"Dewi Anggraini",      dept:"Accounting",    position:"Accountant",           hire_date:"2021-09-01", salary:7500000,  status:"Active" },
];

// ── Fixed Assets ──────────────────────────────────────────────────────────────
export const ASSETS = [
  { id:"a1", asset_no:"FA-001", name:"Factory Building — Bekasi",  category:"Building",   account:"1510", purchase_date:"2015-01-01", cost:3500000000, salvage:350000000, life_years:20, depreciation_method:"SL", book_value:2625000000, accum_dep:875000000,  status:"Active" },
  { id:"a2", asset_no:"FA-002", name:"Hot Press Machine 1000T",     category:"Machinery",  account:"1520", purchase_date:"2016-06-01", cost:850000000,  salvage:85000000,  life_years:10, depreciation_method:"SL", book_value:467500000,  accum_dep:382500000, status:"Active" },
  { id:"a3", asset_no:"FA-003", name:"Rotary Lathe — Raute FX200", category:"Machinery",  account:"1520", purchase_date:"2018-03-15", cost:1200000000, salvage:120000000, life_years:10, depreciation_method:"SL", book_value:780000000,  accum_dep:420000000, status:"Active" },
  { id:"a4", asset_no:"FA-004", name:"Dryer Veneer 4-Deck",         category:"Machinery",  account:"1520", purchase_date:"2019-08-01", cost:650000000,  salvage:65000000,  life_years:10, depreciation_method:"SL", book_value:487500000,  accum_dep:162500000, status:"Active" },
  { id:"a5", asset_no:"FA-005", name:"Forklift Toyota 3T",          category:"Vehicle",    account:"1530", purchase_date:"2020-01-01", cost:380000000,  salvage:38000000,  life_years:8,  depreciation_method:"SL", book_value:251250000,  accum_dep:128750000, status:"Active" },
  { id:"a6", asset_no:"FA-006", name:"Toyota Innova (Operational)", category:"Vehicle",    account:"1530", purchase_date:"2022-05-01", cost:350000000,  salvage:70000000,  life_years:8,  depreciation_method:"SL", book_value:271250000,  accum_dep:78750000,  status:"Active" },
];

// ── Shipments ─────────────────────────────────────────────────────────────────
export const SHIPMENTS = [
  { id:"sh1", shipment_no:"SHP-2026-088", so_id:"so3", customer_id:"c3", date:days_ago(5), vessel:"MV Star Pioneer V.12N", port_loading:"Tanjung Priok, Jakarta", port_discharge:"Jebel Ali, Dubai", bl_no:"MSCU7891234", status:"Shipped", container:"1×40HQ", gross_weight:"22,500 kg", cbm:67.2,
    docs:[{type:"Bill of Lading",no:"MSCU7891234",status:"Received"},{type:"Certificate of Origin",no:"CO-2026-0891",status:"Received"},{type:"Packing List",no:"PL-SO3",status:"Done"},{type:"Commercial Invoice",no:"INV-2026-0198",status:"Done"},{type:"SVLK Certificate",no:"SVLK-2026-0234",status:"Valid"}]},
  { id:"sh2", shipment_no:"SHP-2026-089", so_id:"so1", customer_id:"c1", date:days_from_now(18), vessel:"TBD", port_loading:"Tanjung Priok, Jakarta", port_discharge:"Osaka, Japan", bl_no:"—", status:"Planned", container:"1×40HQ", gross_weight:"Est. 21,000 kg", cbm:62.8,
    docs:[{type:"Packing List",no:"—",status:"Pending"},{type:"Commercial Invoice",no:"—",status:"Pending"},{type:"SVLK Certificate",no:"SVLK-2026-0234",status:"Valid"}]},
];

// ── P&L Data (monthly summary for reports) ───────────────────────────────────
export const PNL_MONTHLY = [
  { month:"Oct 2025", revenue:2320000000, cogs:1624000000, gross:696000000, opex:385000000, ebitda:311000000, interest:45000000, tax:66500000, net:199500000 },
  { month:"Nov 2025", revenue:2580000000, cogs:1806000000, gross:774000000, opex:392000000, ebitda:382000000, interest:45000000, tax:84200000,  net:252800000 },
  { month:"Dec 2025", revenue:2150000000, cogs:1505000000, gross:645000000, opex:388000000, ebitda:257000000, interest:45000000, tax:52800000,  net:159200000 },
  { month:"Jan 2026", revenue:2450000000, cogs:1715000000, gross:735000000, opex:395000000, ebitda:340000000, interest:45000000, tax:73750000,  net:221250000 },
  { month:"Feb 2026", revenue:2680000000, cogs:1876000000, gross:804000000, opex:401000000, ebitda:403000000, interest:45000000, tax:89450000,  net:268550000 },
  { month:"Mar 2026", revenue:1850000000, cogs:1295000000, gross:555000000, opex:390000000, ebitda:165000000, interest:45000000, tax:30000000,  net:90000000  },
];

export const BALANCE_SHEET = {
  date: TODAY(),
  assets: {
    cash: 1630000000,
    ar: 820500000,
    inventory: 2142000000,
    prepaid: 125000000,
    fixed_net: 4682500000,
  },
  liabilities: {
    ap: 620250000,
    accrued: 185000000,
    tax_payable: 94500000,
    short_loans: 500000000,
    long_loans: 2800000000,
  },
  equity: {
    paid_in: 2000000000,
    retained: 3099250000,
  },
};
