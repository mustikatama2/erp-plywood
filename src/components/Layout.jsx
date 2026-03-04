import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ToastProvider, toast } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useMDM } from "../contexts/MDMContext";
import { canApproveMDM } from "../lib/mdm";
import { COMPANY } from "../data/seed";
import { GlobalSearchProvider, useGlobalSearch } from "./GlobalSearch";
import NotificationCenter from "./NotificationCenter";

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
    { to:"/inventory/report",    icon:"📋", label:"Inventory Report",  bi:"Laporan Stok"      },
  ]},
  { label:"Keuangan",   items:[
    { to:"/finance/ar",          icon:"💰", label:"AR",                bi:"Piutang Dagang"    },
    { to:"/finance/ap",          icon:"💳", label:"AP",                bi:"Hutang Dagang"     },
    { to:"/finance/banks",       icon:"🏦", label:"Banks & Cash",      bi:"Bank & Kas"        },
    { to:"/finance/ledger",      icon:"📒", label:"Ledger",            bi:"Buku Besar"        },
    { to:"/finance/reports",     icon:"📈", label:"Reports",           bi:"Laporan Keuangan"  },
    { to:"/finance/biaya",       icon:"📆", label:"Prepaid Expenses",  bi:"Biaya Dibayar Muka"},
  ]},
  { label:"Kepatuhan",  items:[
    { to:"/finance/lc",          icon:"🏦", label:"LC Tracker",        bi:"Letter of Credit"  },
    { to:"/compliance/svlk",     icon:"📜", label:"SVLK Tracker",      bi:"Sertifikat SVLK"   },
  ]},
  { label:"Operasional",items:[
    { to:"/production",          icon:"🏭", label:"Production",        bi:"Produksi"          },
    { to:"/production/costing",  icon:"⚙️",  label:"Costing",          bi:"Biaya Produksi"    },
    { to:"/hr/employees",        icon:"👤", label:"Employees",         bi:"Karyawan"          },
    { to:"/hr/payroll",          icon:"💵", label:"Payroll",           bi:"Penggajian"        },
    { to:"/assets",              icon:"🏗️", label:"Fixed Assets",      bi:"Aset Tetap"        },
  ]},
  { label:"AI & Analitik", items:[
    { to:"/ai",                  icon:"🤖", label:"AI Assistant",      bi:"Asisten AI"        },
  ]},
  { label:"Admin",      items:[
    { to:"/admin/mdm",           icon:"🗂️", label:"MDM Queue",         bi:"Antrian Data Induk", adminOnly: true },
    { to:"/admin/activity",      icon:"📋", label:"Activity Log",      bi:"Log Aktivitas",      adminOnly: true },
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

// ── Keyboard Help Modal ───────────────────────────────────────────────────────
function KeyboardHelp({ onClose }) {
  const shortcuts = [
    { keys: ["⌘", "K"],  desc: "Global Search — cari apa saja" },
    { keys: ["⌘", "N"],  desc: "Buat record baru (context-aware)" },
    { keys: ["⌘", "/"],  desc: "Tampilkan daftar keyboard shortcuts" },
    { keys: ["ESC"],     desc: "Tutup modal yang sedang terbuka" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">⌨️ Keyboard Shortcuts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Shortcut untuk navigasi cepat</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-3">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="inline-flex items-center px-2 py-1 text-xs font-mono font-bold bg-gray-100 border border-gray-300 rounded-md text-gray-700 shadow-sm">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function LayoutInner({ children }) {
  const { user, role, logout, can } = useAuth();
  const { pendingCount } = useMDM();
  const { setOpen: openSearch } = useGlobalSearch();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = canApproveMDM(user?.role);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      // ⌘K — Global Search (handled by GlobalSearch context)
      if (e.key === "k") {
        e.preventDefault();
        openSearch(true);
        return;
      }

      // ⌘N — Context-aware new record
      if (e.key === "n") {
        e.preventDefault();
        const path = location.pathname;
        if (path === "/sales/orders")    { navigate("/sales/orders?new=1");    return; }
        if (path === "/finance/ar")      { navigate("/finance/ar?new=1");      return; }
        if (path === "/finance/ap")      { navigate("/finance/ap?new=1");      return; }
        if (path === "/hr/employees")    { navigate("/hr/employees?new=1");    return; }
        if (path === "/purchasing/orders") { navigate("/purchasing/orders?new=1"); return; }
        toast("Gunakan tombol + di halaman ini", "info");
        return;
      }

      // ⌘/ — Keyboard shortcuts help
      if (e.key === "/") {
        e.preventDefault();
        setShowKeyboardHelp(prev => !prev);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [location.pathname, navigate, openSearch]);

  // Filter nav items the current user can access
  const filteredNav = NAV.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.adminOnly && !isAdmin) return false;
      return can(item.to);
    }),
  })).filter(group => group.items.length > 0);

  const activeItem = NAV.flatMap(g => g.items).find(i => i.to === location.pathname);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // MTG logo SVG component
  const MTGLogo = ({ size = 34 }) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <rect width="40" height="40" rx="8" fill="#F0C200"/>
      <text x="20" y="26" fontFamily="Georgia, serif" fontWeight="900" fontSize="13" fill="#1A1C14" textAnchor="middle" letterSpacing="0.5">MTG</text>
    </svg>
  );

  const SidebarContent = () => (
    <>
      {/* Brand header — company identity */}
      <div className={`flex items-center gap-3 px-4 py-4 flex-shrink-0 ${collapsed?"justify-center":""}`}
        style={{ borderBottom: '1px solid rgba(240,194,0,0.15)' }}>
        <MTGLogo size={collapsed ? 30 : 34} />
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-black text-white truncate leading-tight" style={{ fontFamily: 'Georgia, serif', fontSize: 13, letterSpacing: 0.4 }}>
              Mustikatama
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--gold)', opacity: 0.7, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ERP System · Est. 1989
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {filteredNav.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="section-title px-2 mb-1.5">{group.label}</p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isMDMNav = item.to === "/admin/mdm";
                const badge = isMDMNav && pendingCount > 0 ? pendingCount : null;
                return (
                <NavLink key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                      isActive ? "nav-item-active shadow-sm" : "hover:bg-gray-800"
                    }`
                  }
                  style={({ isActive }) => isActive ? {} : { color: 'var(--text-secondary)' }}>
                  <span className="flex-shrink-0 text-lg leading-none relative">
                    {item.icon}
                    {badge && collapsed && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-gray-950" />
                    )}
                  </span>
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="leading-tight text-xs font-semibold truncate">{item.bi || item.label}</p>
                      {item.bi && <p className="text-xs opacity-40 truncate leading-tight">{item.label}</p>}
                    </div>
                  )}
                  {!collapsed && badge && (
                    <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-black bg-amber-500 text-black rounded-full">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="p-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(240,194,0,0.12)' }}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: 'var(--gold)', color: '#1A1C14' }}>
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${role?.color}`}>{role?.label}</span>
              </div>
              <button onClick={handleLogout} title="Keluar"
                className="text-gray-600 hover:text-red-400 transition-colors text-sm flex-shrink-0">⏏</button>
            </div>
          ) : (
            <button onClick={handleLogout} title="Keluar"
              className="w-full flex justify-center text-gray-600 hover:text-red-400 transition-colors">⏏</button>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="hidden md:flex m-2 p-2 rounded-lg text-xs justify-center items-center flex-shrink-0 transition-colors"
        style={{ background: 'rgba(240,194,0,0.08)', color: 'var(--gold)', border: '1px solid rgba(240,194,0,0.15)' }}>
        {collapsed ? "▶" : "◀ Kecilkan"}
      </button>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {mobileOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col sidebar-brand ${collapsed?"w-16":"w-60"} flex-shrink-0 transition-all duration-200 overflow-hidden`}
        style={{ borderRight: '1px solid rgba(240,194,0,0.12)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 flex flex-col w-72 sidebar-brand transition-transform duration-300 ${mobileOpen?"translate-x-0":"-translate-x-full"}`}
        style={{ borderRight: '1px solid rgba(240,194,0,0.12)' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0 gap-3"
          style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid rgba(240,194,0,0.1)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-800 text-gray-400">☰</button>
            <div className="min-w-0">
              <p className="font-bold text-white truncate">{activeItem?.bi || activeItem?.label || "Dashboard"}</p>
              {activeItem?.bi && <p className="text-xs text-gray-500 hidden sm:block">{activeItem.label}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* ⌘K search pill */}
            <button
              onClick={() => openSearch(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-gray-400 hover:text-gray-200 transition-colors"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span>🔍</span>
              <span>Cari…</span>
              <kbd className="text-gray-500 font-mono text-xs border border-gray-600 rounded px-1">⌘K</kbd>
            </button>
            <LiveClock />
            {/* Notification Center */}
            <NotificationCenter />
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
      {showKeyboardHelp && <KeyboardHelp onClose={() => setShowKeyboardHelp(false)} />}
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <GlobalSearchProvider>
      <LayoutInner>{children}</LayoutInner>
    </GlobalSearchProvider>
  );
}
