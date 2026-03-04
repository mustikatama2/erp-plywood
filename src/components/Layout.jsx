import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ToastProvider } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { COMPANY } from "../data/seed";

const NAV = [
  { label:"Ringkasan",  items:[
    { to:"/",                    icon:"📊", label:"Dashboard",         bi:"Beranda"           },
  ]},
  { label:"Penjualan",  items:[
    { to:"/sales/customers",     icon:"👥", label:"Customers",         bi:"Data Pelanggan"    },
    { to:"/sales/orders",        icon:"📄", label:"Sales Orders",      bi:"Order Penjualan"   },
    { to:"/sales/proforma",      icon:"📋", label:"Proforma Invoice",  bi:"PI / Penawaran"    },
    { to:"/sales/shipments",     icon:"🚢", label:"Shipments",         bi:"Pengiriman"        },
  ]},
  { label:"Pembelian",  items:[
    { to:"/purchasing/vendors",  icon:"🏢", label:"Vendors",           bi:"Pemasok"           },
    { to:"/purchasing/orders",   icon:"🛒", label:"Purchase Orders",   bi:"Order Beli"        },
    { to:"/purchasing/receipts", icon:"📦", label:"Goods Receipts",    bi:"Penerimaan Barang" },
  ]},
  { label:"Inventori",  items:[
    { to:"/inventory/products",  icon:"🪵", label:"Products",          bi:"Daftar Produk"     },
    { to:"/inventory/stock",     icon:"📐", label:"Stock Levels",      bi:"Stok Saat Ini"     },
    { to:"/inventory/movements", icon:"🔄", label:"Movements",         bi:"Mutasi Stok"       },
  ]},
  { label:"Keuangan",   items:[
    { to:"/finance/ar",          icon:"💰", label:"AR",                bi:"Piutang Dagang"    },
    { to:"/finance/ap",          icon:"💳", label:"AP",                bi:"Hutang Dagang"     },
    { to:"/finance/banks",       icon:"🏦", label:"Banks & Cash",      bi:"Bank & Kas"        },
    { to:"/finance/ledger",      icon:"📒", label:"Ledger",            bi:"Buku Besar"        },
    { to:"/finance/reports",     icon:"📈", label:"Reports",           bi:"Laporan Keuangan"  },
  ]},
  { label:"Operasional",items:[
    { to:"/production",          icon:"🏭", label:"Production",        bi:"Produksi"          },
    { to:"/hr/employees",        icon:"👤", label:"Employees",         bi:"Karyawan"          },
    { to:"/hr/payroll",          icon:"💵", label:"Payroll",           bi:"Penggajian"        },
    { to:"/assets",              icon:"🏗️", label:"Fixed Assets",      bi:"Aset Tetap"        },
  ]},
  { label:"Pengaturan", items:[
    { to:"/settings/coa",        icon:"📑", label:"Chart of Accounts", bi:"Daftar Akun"       },
    { to:"/settings/company",    icon:"⚙️", label:"Company",           bi:"Perusahaan"        },
  ]},
];

function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <span className="font-mono text-xs text-gray-500">
      {t.toLocaleDateString("id-ID", { weekday:"short", day:"2-digit", month:"short" })}
      &nbsp;·&nbsp;
      {t.toLocaleTimeString("id-ID")}
    </span>
  );
}

export default function Layout({ children }) {
  const { user, role, logout, can } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Filter nav items the current user can access
  const filteredNav = NAV.map(group => ({
    ...group,
    items: group.items.filter(item => can(item.to)),
  })).filter(group => group.items.length > 0);

  const activeItem = NAV.flatMap(g => g.items).find(i => i.to === location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
        {filteredNav.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-xs text-gray-600 uppercase tracking-widest font-bold px-2 mb-1.5">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold shadow-sm"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`
                  }>
                  <span className="flex-shrink-0 text-lg leading-none">{item.icon}</span>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="leading-tight text-xs font-semibold truncate">{item.bi || item.label}</p>
                      {item.bi && <p className="text-xs opacity-40 truncate leading-tight">{item.label}</p>}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      {user && !collapsed && (
        <div className="border-t border-gray-800 p-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full ${user.avatarColor || "bg-blue-600"} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
              {user.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">{user.name}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${role?.color}`}>{role?.label}</span>
            </div>
            <button onClick={handleLogout} title="Keluar" className="text-gray-600 hover:text-red-400 transition-colors text-base flex-shrink-0">⏏</button>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex m-3 p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-500 text-xs justify-center items-center flex-shrink-0 transition-colors">
        {collapsed ? "▶" : "◀ Kecilkan"}
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col ${collapsed?"w-16":"w-60"} flex-shrink-0 bg-gray-900 border-r border-gray-800 transition-all duration-200 overflow-hidden`}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-gray-900 border-r border-gray-800 transition-transform duration-300 ${mobileOpen?"translate-x-0":"-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400">☰</button>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{activeItem?.bi || activeItem?.label || "Dashboard"}</p>
              {activeItem?.bi && <p className="text-xs text-gray-500 hidden sm:block">{activeItem.label}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <LiveClock />
            {/* User menu */}
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)}
                className={`w-8 h-8 rounded-full ${user?.avatarColor || "bg-blue-600"} flex items-center justify-center text-xs font-black text-white hover:opacity-80 transition-opacity`}>
                {user?.avatar || "?"}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-10 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-56 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800">
                    <p className="font-bold text-white text-sm">{user?.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{user?.dept} · {user?.username}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium mt-1 inline-block ${role?.color}`}>{role?.labelBI}</span>
                  </div>
                  <div className="p-2">
                    <button onClick={() => { setShowUserMenu(false); navigate("/settings/company"); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm text-gray-300 transition-colors">
                      ⚙️ Pengaturan
                    </button>
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm text-red-400 transition-colors mt-0.5">
                      ⏏ Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6" onClick={() => setShowUserMenu(false)}>
          {children}
        </main>
      </div>

      <ToastProvider />
    </div>
  );
}
