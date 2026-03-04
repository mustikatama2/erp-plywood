# Changelog — ERP Mustikatama

All notable changes to this project are documented here.
Versioning follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

---

## [1.2.0] — 2026-03-04

### 🎨 Design Overhaul
- **New brand theme**: warm olive-dark palette from mustikatama.com (`#1A1C14`, `#F0C200` gold, `#1B6830` forest green)
- **MTG logo** added to sidebar (gold on olive, matches company brand)
- **Remapped Tailwind gray scale** to warm olive tones — every component updated automatically
- **Gold active nav state**: active sidebar item uses brand gold (#F0C200) on dark text
- **Wood-grain subtle pattern** on sidebar background
- **CSS variables** for all brand colors (easy to customize per deployment)
- **Improved typography**: labels now uppercase + tracking, better visual hierarchy
- **Section color coding**: sales/finance/inventory/ops visually differentiated

### 🗂️ Master Data Management (MDM) System
- **MDM workflow** for all master data: Customers, Vendors, Products, Employees, Banks, Chart of Accounts
- **Role-based submission**: non-admin submits "request" → admin approves before record goes active
- **Pending approval queue** at `/admin/mdm` — admin-only page
- **MDMContext**: localStorage-backed, survives page refresh
- **Pending badge** on sidebar nav for admin users
- **Soft deactivation** replaces hard delete — records never lost
- **MDMGate components**: `MDMAddButton`, `MDMStatusBadge`, `MDMApproveInline`, `MDMDeactivateButton`
- `ProtectedRoute` updated to support `allowedRoles` prop

### 🆕 New Modules
- **📆 Biaya Dibayar Muka** (`/finance/biaya`): Prepaid expense amortization — insurance, licenses, SVLK certs, advance rent; monthly amortization schedule with progress tracking
- **⚙️ Biaya Produksi — Semi-Actual Costing** (`/production/costing`): DM actual cost + DL/FOH standard rate applied; variance analysis (DM price/qty, DL rate/efficiency, FOH spending/volume); month-end journal suggestion
- **📋 Laporan Stok** (`/inventory/report`): Per-SKU stock card with opening balance, all movements, closing balance; period selector; click-to-drill stock card view; CSV export

### 📊 Improved Reports
- **Period picker** on Financial Reports: preset buttons (1M, 3M, 6M, YTD, All) + manual month range selector
- All charts and P&L statement now filter by selected period

### 📦 Inventory Movements — Full Rebuild
- Replaced stub with real per-SKU movement page
- Two views: SKU Summary (opening/in/out/adj/closing per product) + Transaction Detail
- Bar chart: top 5 SKUs by movement volume
- Filter by type (IN/OUT/ADJ) + product dropdown + search
- Click SKU row to jump to its transaction detail
- CSV export

### 🏗️ Fixed Assets — Full Rebuild  
- Full CRUD: add new asset with straight-line depreciation preview
- Auto-calculates accumulated depreciation from purchase date → today
- Asset detail: depreciation schedule year-by-year, current book value, % depreciated
- Progress bar per asset showing depreciation progress
- "Run Depreciation" button + "Retire Asset" workflow
- KPI cards: total cost, net book value, monthly depreciation charge

---

## [1.1.0] — 2026-02-28

### ✨ AI Features (4 modules)
- **🤖 AI Document Parser** (AP page): paste invoice text → Claude extracts vendor, amount, dates → auto-fills form
- **📈 Cash Flow Forecast**: 90-day projection chart from AR/AP due dates + bank balances; AI-generated narrative
- **🔍 Anomaly Detection**: duplicate invoice detection, unusual amounts, overdue AR, cash concentration alerts
- **💬 Natural Language Query**: chat interface in Bahasa Indonesia/English against live ERP data; streaming responses
- AI Assistant page (`/ai`) with 3 tabs: Chat, Anomalies, Forecast
- Server-side Claude API routes (`/api/ai/*`) for on-prem; demo fallback for Vercel

---

## [1.0.0] — 2026-02-15

### 🎉 Initial Release
- Full ERP scaffold: 20+ modules, bilingual (Indonesian + English)
- 7 roles with RBAC: admin, finance, sales, purchasing, warehouse, hr, viewer
- Seed data: customers, vendors, products, employees, assets, PnL, balance sheet
- Working CRUD: Customers, Vendors, Products, Sales Orders, Purchase Orders, AP bills
- SO status workflow: Draft → Confirmed → In Progress → Shipped
- Docker stack: multi-stage React+Nginx + Express API + PostgreSQL + sync daemon
- Supabase cloud sync for hybrid on-prem architecture
- Vercel demo deployment at `erp-plywood.vercel.app`

---

## Version Guide

| Version | Focus                          |
|---------|-------------------------------|
| 1.2.x   | Design + MDM + New modules    |
| 1.1.x   | AI features                   |
| 1.0.x   | Core ERP + Docker             |

**Next planned: 1.3.0**
- Wire React pages to Express API (live data from PostgreSQL)
- Admin panel: user management, password reset
- LC (Letter of Credit) Tracker module
- SVLK certificate compliance dashboard
- OEE dashboard embedded in Production page
