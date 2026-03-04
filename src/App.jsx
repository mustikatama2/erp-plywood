import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard        from "./pages/dashboard/Dashboard";
import Customers        from "./pages/sales/Customers";
import SalesOrders      from "./pages/sales/SalesOrders";
import ProformaInvoices from "./pages/sales/ProformaInvoices";
import Shipments        from "./pages/sales/Shipments";
import Vendors          from "./pages/purchasing/Vendors";
import PurchaseOrders   from "./pages/purchasing/PurchaseOrders";
import GoodsReceipts    from "./pages/purchasing/GoodsReceipts";
import Products         from "./pages/inventory/Products";
import StockLevels      from "./pages/inventory/StockLevels";
import Movements        from "./pages/inventory/Movements";
import AR               from "./pages/finance/AR";
import AP               from "./pages/finance/AP";
import Banks            from "./pages/finance/Banks";
import Ledger           from "./pages/finance/Ledger";
import Reports          from "./pages/finance/Reports";
import Production       from "./pages/operations/Production";
import Employees        from "./pages/operations/Employees";
import Payroll          from "./pages/operations/Payroll";
import Assets           from "./pages/operations/Assets";
import ChartOfAccounts  from "./pages/settings/ChartOfAccounts";
import CompanySettings  from "./pages/settings/CompanySettings";

const Stub = ({ name }) => (
  <div className="text-center py-24 text-gray-500">
    <p className="text-5xl mb-3">🚧</p>
    <p className="text-lg font-bold text-gray-400">{name}</p>
    <p className="text-sm mt-1">Module in development</p>
  </div>
);

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"                    element={<Dashboard />} />
        <Route path="/alerts"              element={<Stub name="Alerts" />} />
        <Route path="/sales/customers"     element={<Customers />} />
        <Route path="/sales/orders"        element={<SalesOrders />} />
        <Route path="/sales/proforma"      element={<ProformaInvoices />} />
        <Route path="/sales/shipments"     element={<Shipments />} />
        <Route path="/purchasing/vendors"  element={<Vendors />} />
        <Route path="/purchasing/orders"   element={<PurchaseOrders />} />
        <Route path="/purchasing/receipts" element={<GoodsReceipts />} />
        <Route path="/inventory/products"  element={<Products />} />
        <Route path="/inventory/stock"     element={<StockLevels />} />
        <Route path="/inventory/movements" element={<Movements />} />
        <Route path="/finance/ar"          element={<AR />} />
        <Route path="/finance/ap"          element={<AP />} />
        <Route path="/finance/banks"       element={<Banks />} />
        <Route path="/finance/ledger"      element={<Ledger />} />
        <Route path="/finance/reports"     element={<Reports />} />
        <Route path="/production"          element={<Production />} />
        <Route path="/hr/employees"        element={<Employees />} />
        <Route path="/hr/payroll"          element={<Payroll />} />
        <Route path="/assets"              element={<Assets />} />
        <Route path="/settings/coa"        element={<ChartOfAccounts />} />
        <Route path="/settings/company"    element={<CompanySettings />} />
      </Routes>
    </Layout>
  );
}
