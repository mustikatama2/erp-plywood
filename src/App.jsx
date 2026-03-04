import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MDMProvider } from "./contexts/MDMContext";
import { JournalProvider } from "./contexts/JournalContext";
import { ActivityProvider } from "./contexts/ActivityContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/auth/Login";

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
import AIAssistant      from "./pages/ai/AIAssistant";
import MDMQueue         from "./pages/admin/MDMQueue";
import ActivityLog      from "./pages/admin/ActivityLog";
import Biaya            from "./pages/finance/Biaya";
import Costing          from "./pages/production/Costing";
import InventoryReport  from "./pages/inventory/InventoryReport";
import LC               from "./pages/finance/LC";
import SVLK             from "./pages/finance/SVLK";

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected — all inside Layout */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/"                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            {/* Sales */}
            <Route path="/sales/customers"     element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/sales/orders"        element={<ProtectedRoute><SalesOrders /></ProtectedRoute>} />
            <Route path="/sales/proforma"      element={<ProtectedRoute><ProformaInvoices /></ProtectedRoute>} />
            <Route path="/sales/shipments"     element={<ProtectedRoute><Shipments /></ProtectedRoute>} />
            {/* Purchasing */}
            <Route path="/purchasing/vendors"  element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/purchasing/orders"   element={<ProtectedRoute><PurchaseOrders /></ProtectedRoute>} />
            <Route path="/purchasing/receipts" element={<ProtectedRoute><GoodsReceipts /></ProtectedRoute>} />
            {/* Inventory */}
            <Route path="/inventory/products"  element={<ProtectedRoute><Products /></ProtectedRoute>} />
            <Route path="/inventory/stock"     element={<ProtectedRoute><StockLevels /></ProtectedRoute>} />
            <Route path="/inventory/movements" element={<ProtectedRoute><Movements /></ProtectedRoute>} />
            {/* Finance */}
            <Route path="/finance/ar"          element={<ProtectedRoute><AR /></ProtectedRoute>} />
            <Route path="/finance/ap"          element={<ProtectedRoute><AP /></ProtectedRoute>} />
            <Route path="/finance/banks"       element={<ProtectedRoute><Banks /></ProtectedRoute>} />
            <Route path="/finance/ledger"      element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
            <Route path="/finance/reports"     element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/finance/biaya"       element={<ProtectedRoute><Biaya /></ProtectedRoute>} />
            <Route path="/finance/lc"          element={<ProtectedRoute><LC /></ProtectedRoute>} />
            {/* Inventory */}
            <Route path="/inventory/report"    element={<ProtectedRoute><InventoryReport /></ProtectedRoute>} />
            {/* Operations */}
            <Route path="/production"          element={<ProtectedRoute><Production /></ProtectedRoute>} />
            <Route path="/production/costing"  element={<ProtectedRoute><Costing /></ProtectedRoute>} />
            <Route path="/hr/employees"        element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/hr/payroll"          element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
            <Route path="/assets"              element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            {/* Settings */}
            <Route path="/settings/coa"        element={<ProtectedRoute><ChartOfAccounts /></ProtectedRoute>} />
            <Route path="/settings/company"    element={<ProtectedRoute><CompanySettings /></ProtectedRoute>} />
            {/* AI */}
            <Route path="/ai"                  element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
            {/* Compliance */}
            <Route path="/compliance/svlk"     element={<ProtectedRoute><SVLK /></ProtectedRoute>} />
            {/* Admin */}
            <Route path="/admin/mdm"           element={<ProtectedRoute allowedRoles={["admin"]}><MDMQueue /></ProtectedRoute>} />
            <Route path="/admin/activity"      element={<ProtectedRoute allowedRoles={["admin"]}><ActivityLog /></ProtectedRoute>} />
            <Route path="*"                    element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <MDMProvider>
          <ActivityProvider>
            <AppRoutes />
          </ActivityProvider>
        </MDMProvider>
      </JournalProvider>
    </AuthProvider>
  );
}
