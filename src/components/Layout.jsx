import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ToastProvider } from "./ui";
import { COMPANY } from "../data/seed";

const NAV = [
  { label: "Ringkasan",    en:"Overview",    items: [
    { to:"/",           icon:"📊", label:"Dashboard",              bi:"Beranda"          },
  ]},
  { label: "Penjualan",    en:"Sales",        items: [
    { to:"/sales/customers",  icon:"👥", label:"Customers",         bi:"Data Pelanggan"  },
    { to:"/sales/orders",     icon:"📄", label:"Sales Orders",      bi:"Order Penjualan" },
    { to:"/sales/proforma",   icon:"📋", label:"Proforma Invoice",  bi:"PI / Penawaran"  },
    { to:"/sales/shipments",  icon:"🚢", label:"Shipments",         bi:"Pengiriman"      },
  ]},
  { label: "Pembelian",    en:"Purchasing",   items: [
    { to:"/purchasing/vendors",  icon:"🏢", label:"Vendors",       bi:"Pemasok"         },
    { to:"/purchasing/orders",   icon:"🛒", label:"Purchase Orders",bi:"Order Beli"      },
    { to:"/purchasing/receipts", icon:"📦", label:"Goods Receipts", bi:"Penerimaan Brg." },
  ]},
  { label: "Inventori",    en:"Inventory",    items: [
    { to:"/inventory/products",  icon:"🪵", label:"Products",      bi:"Daftar Produk"   },
    { to:"/inventory/stock",     icon:"📐", label:"Stock Levels",   bi:"Stok Saat Ini"  },
    { to:"/inventory/movements", icon:"🔄", label:"Movements",      bi:"Mutasi Stok"    },
  ]},
  { label: "Keuangan",     en:"Finance",      items: [
    { to:"/finance/ar",          icon:"💰", label:"AR",            bi:"Piutang Dagang"  },
    { to:"/finance/ap",          icon:"💳", label:"AP",            bi:"Hutang Dagang"   },
    { to:"/finance/banks",       icon:"🏦", label:"Banks & Cash",  bi:"Bank & Kas"      },
    { to:"/finance/ledger",      icon:"📒", label:"Ledger",        bi:"Buku Besar"      },
    { to:"/finance/reports",     icon:"📈", label:"Reports",       bi:"Laporan Keuangan"},
  ]},
  { label: "Operasional",  en:"Operations",   items: [
    { to:"/production",          icon:"🏭", label:"Production",    bi:"Produksi"        },
    { to:"/hr/employees",        icon:"👤", label:"Employees",     bi:"Karyawan"        },
    { to:"/hr/payroll",          icon:"💵", label:"Payroll",       bi:"Penggajian"      },
    { to:"/assets",              icon:"🏗️", label:"Fixed Assets",  bi:"Aset Tetap"      },
  ]},
  { label: "Pengaturan",   en:"Settings",     items: [
    { to:"/settings/coa",        icon:"📑", label:"Chart of Accounts",bi:"Daftar Akun"  },
    { to:"/settings/company",    icon:"⚙️", label:"Company",       bi:"Perusahaan"      },
  ]},
];

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono text-xs text-gray-500">
      {t.toLocaleDateString("id-ID", { weekday:"short", day:"2-digit", month:"short" })}
      &nbsp;·&nbsp;
      {t.toLocaleTimeString("id-ID")}
    </span>
  );
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on navigation
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const activeItem = NAV.flatMap(g => g.items).find(i => i.to === location.pathname);

  const SidebarContent = () => (
    <>
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-gray-800 flex-shrink-0 ${collapsed?"justify-center":""}`}>
        <span className="text-2xl flex-shrink-0">🪵</span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate leading-tight">{COMPANY.short}</p>
            <p className="text-xs text-gray-500">Sistem ERP</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-xs text-gray-600 uppercase tracking-widest font-bold px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative group ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`
                  }>
                  <span className="flex-shrink-0 text-lg leading-none">{item.icon}</span>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="leading-tight text-xs font-semibold truncate">{item.bi || item.label}</p>
                      {item.bi && <p className="text-xs opacity-50 truncate leading-tight">{item.label}</p>}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex m-3 p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-500 text-xs justify-center items-center gap-1 flex-shrink-0 transition-colors">
        {collapsed ? "▶" : "◀ Kecilkan"}
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className={`hidden md:flex flex-col ${collapsed ? "w-16" : "w-60"} flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-200 overflow-hidden`}>
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-gray-900 border-r border-gray-800 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400">☰</button>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">
                {activeItem?.bi || activeItem?.label || "ERP"}
              </p>
              {activeItem?.label && activeItem?.bi && (
                <p className="text-xs text-gray-500 hidden sm:block">{activeItem.label}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <LiveClock />
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white cursor-pointer" title="Ridho — Admin">
              R
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Toast layer */}
      <ToastProvider />
    </div>
  );
}
