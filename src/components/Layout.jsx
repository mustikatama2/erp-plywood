import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { COMPANY } from "../data/seed";

const NAV = [
  { label: "Overview",    items: [
    { to:"/",           icon:"📊", label:"Dashboard" },
    { to:"/alerts",     icon:"🔔", label:"Alerts",    badge:3 },
  ]},
  { label: "Sales",       items: [
    { to:"/sales/customers",  icon:"👥", label:"Customers"          },
    { to:"/sales/orders",     icon:"📄", label:"Sales Orders"        },
    { to:"/sales/proforma",   icon:"📋", label:"Proforma Invoices"  },
    { to:"/sales/shipments",  icon:"🚢", label:"Shipments"          },
  ]},
  { label: "Purchasing",  items: [
    { to:"/purchasing/vendors",  icon:"🏢", label:"Vendors"         },
    { to:"/purchasing/orders",   icon:"🛒", label:"Purchase Orders" },
    { to:"/purchasing/receipts", icon:"📦", label:"Goods Receipts"  },
  ]},
  { label: "Inventory",   items: [
    { to:"/inventory/products",  icon:"🪵", label:"Products"        },
    { to:"/inventory/stock",     icon:"📐", label:"Stock Levels"    },
    { to:"/inventory/movements", icon:"🔄", label:"Movements"       },
  ]},
  { label: "Finance",     items: [
    { to:"/finance/ar",          icon:"💰", label:"Accounts Receivable" },
    { to:"/finance/ap",          icon:"💳", label:"Accounts Payable"    },
    { to:"/finance/banks",       icon:"🏦", label:"Banks & Cash"        },
    { to:"/finance/ledger",      icon:"📒", label:"General Ledger"      },
    { to:"/finance/reports",     icon:"📈", label:"Financial Reports"   },
  ]},
  { label: "Operations",  items: [
    { to:"/production",          icon:"🏭", label:"Production"          },
    { to:"/hr/employees",        icon:"👤", label:"Employees"           },
    { to:"/hr/payroll",          icon:"💵", label:"Payroll"             },
    { to:"/assets",              icon:"🏗️", label:"Fixed Assets"        },
  ]},
  { label: "Settings",    items: [
    { to:"/settings/coa",        icon:"📑", label:"Chart of Accounts"   },
    { to:"/settings/company",    icon:"⚙️", label:"Company"             },
  ]},
];

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <span className="font-mono text-xs text-gray-500">{t.toLocaleTimeString("id-ID")}</span>;
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const activeLabel = NAV.flatMap(g => g.items).find(i => i.to === location.pathname)?.label || "ERP";

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-14" : "w-56"} flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200 overflow-y-auto`}>
        {/* Brand */}
        <div className={`flex items-center gap-2.5 px-4 py-4 border-b border-gray-800 ${collapsed ? "justify-center" : ""}`}>
          <span className="text-xl flex-shrink-0">🪵</span>
          {!collapsed && (
            <div>
              <p className="text-xs font-black text-white leading-tight">{COMPANY.short}</p>
              <p className="text-xs text-gray-500">ERP System</p>
            </div>
          )}
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-2 py-3 space-y-4">
          {NAV.map(group => (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-xs text-gray-600 uppercase tracking-widest font-bold px-2 mb-1">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors relative ${
                        isActive ? "bg-blue-600 text-white font-semibold" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`
                    }>
                    <span className="flex-shrink-0 text-base">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {item.badge && !collapsed && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">{item.badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button onClick={() => setCollapsed(!collapsed)}
          className="m-3 p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-500 text-xs text-center flex-shrink-0">
          {collapsed ? "▶" : "◀"}
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-white">{activeLabel}</h1>
            <span className="text-gray-700">·</span>
            <LiveClock />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-600">FY 2026 · IDR</span>
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white">R</div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
