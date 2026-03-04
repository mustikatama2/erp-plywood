import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  CUSTOMERS, VENDORS, SALES_ORDERS, PURCHASE_ORDERS,
  AR_INVOICES, AP_INVOICES, EMPLOYEES, PRODUCTS, PROFORMAS, SHIPMENTS,
} from "../data/seed";

// ── Context ───────────────────────────────────────────────────────────────────
const GlobalSearchContext = createContext(null);

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) return { open: false, setOpen: () => {} };
  return ctx;
}

// ── Search logic ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    key: "customers", label: "Customers", icon: "🏢", route: "/sales/customers",
    items: CUSTOMERS,
    match: (q, i) => [i.name, i.code, i.country, i.contact].some(f => f?.toLowerCase().includes(q)),
    title: (i) => i.name,
    sub: (i) => `${i.code} · ${i.country}`,
  },
  {
    key: "vendors", label: "Vendors", icon: "🏭", route: "/purchasing/vendors",
    items: VENDORS,
    match: (q, i) => [i.name, i.code, i.category].some(f => f?.toLowerCase().includes(q)),
    title: (i) => i.name,
    sub: (i) => `${i.code} · ${i.category}`,
  },
  {
    key: "sales_orders", label: "Sales Orders", icon: "📄", route: "/sales/orders",
    items: SALES_ORDERS,
    match: (q, i) => {
      const cust = CUSTOMERS.find(c => c.id === i.customer_id);
      return [i.so_no, cust?.name, i.status].some(f => f?.toLowerCase().includes(q));
    },
    title: (i) => i.so_no,
    sub: (i) => {
      const c = CUSTOMERS.find(c => c.id === i.customer_id);
      return `${c?.name || "—"} · ${i.status}`;
    },
  },
  {
    key: "purchase_orders", label: "Purchase Orders", icon: "🛒", route: "/purchasing/orders",
    items: PURCHASE_ORDERS,
    match: (q, i) => {
      const v = VENDORS.find(v => v.id === i.vendor_id);
      return [i.po_no, v?.name, i.status].some(f => f?.toLowerCase().includes(q));
    },
    title: (i) => i.po_no,
    sub: (i) => {
      const v = VENDORS.find(v => v.id === i.vendor_id);
      return `${v?.name || "—"} · ${i.status}`;
    },
  },
  {
    key: "ar_invoices", label: "AR Invoices", icon: "💰", route: "/finance/ar",
    items: AR_INVOICES,
    match: (q, i) => {
      const c = CUSTOMERS.find(c => c.id === i.customer_id);
      return [i.inv_no, c?.name, i.status].some(f => f?.toLowerCase().includes(q));
    },
    title: (i) => i.inv_no,
    sub: (i) => {
      const c = CUSTOMERS.find(c => c.id === i.customer_id);
      return `${c?.name || "—"} · ${i.status}`;
    },
  },
  {
    key: "ap_invoices", label: "AP Invoices", icon: "💳", route: "/finance/ap",
    items: AP_INVOICES,
    match: (q, i) => {
      const v = VENDORS.find(v => v.id === i.vendor_id);
      return [i.inv_no, v?.name, i.status].some(f => f?.toLowerCase().includes(q));
    },
    title: (i) => i.inv_no,
    sub: (i) => {
      const v = VENDORS.find(v => v.id === i.vendor_id);
      return `${v?.name || "—"} · ${i.status}`;
    },
  },
  {
    key: "employees", label: "Employees", icon: "👤", route: "/hr/employees",
    items: EMPLOYEES,
    match: (q, i) => [i.name, i.dept, i.position, i.emp_no].some(f => f?.toLowerCase().includes(q)),
    title: (i) => i.name,
    sub: (i) => `${i.dept} · ${i.position}`,
  },
  {
    key: "products", label: "Products", icon: "🪵", route: "/inventory/products",
    items: PRODUCTS,
    match: (q, i) => [i.name, i.code, i.spec, i.category].some(f => f?.toLowerCase().includes(q)),
    title: (i) => i.name,
    sub: (i) => `${i.code} · ${i.category}`,
  },
  {
    key: "proformas", label: "Proforma Invoices", icon: "📋", route: "/sales/proforma",
    items: PROFORMAS,
    match: (q, i) => {
      const c = CUSTOMERS.find(c => c.id === i.customer_id);
      return [i.pi_no, c?.name, i.status].some(f => f?.toLowerCase().includes(q));
    },
    title: (i) => i.pi_no,
    sub: (i) => {
      const c = CUSTOMERS.find(c => c.id === i.customer_id);
      return `${c?.name || "—"} · ${i.status}`;
    },
  },
  {
    key: "shipments", label: "Shipments", icon: "🚢", route: "/sales/shipments",
    items: SHIPMENTS,
    match: (q, i) => [i.shipment_no, i.bl_no, i.vessel, i.status].some(f => f?.toLowerCase().includes(q)),
    title: (i) => i.shipment_no,
    sub: (i) => `${i.vessel || "—"} · ${i.status}`,
  },
];

const SHORTCUTS = [
  { label: "+ New Sales Order",  route: "/sales/orders",       icon: "📄" },
  { label: "+ New AR Invoice",   route: "/finance/ar",         icon: "💰" },
  { label: "+ New AP Bill",      route: "/finance/ap",         icon: "💳" },
  { label: "+ New Proforma",     route: "/sales/proforma",     icon: "📋" },
  { label: "📊 Reports",         route: "/finance/reports",    icon: "📈" },
  { label: "🏦 LC Tracker",      route: "/finance/lc",         icon: "🏦" },
];

function search(query) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const results = [];
  for (const cat of CATEGORIES) {
    const matched = cat.items.filter(i => cat.match(q, i)).slice(0, 4);
    if (matched.length > 0) {
      results.push({ ...cat, results: matched });
    }
  }
  return results;
}

// ── Component ─────────────────────────────────────────────────────────────────
function GlobalSearchModal({ open, setOpen }) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = search(query);

  // Flatten all results for keyboard navigation
  const flat = results.flatMap(cat =>
    cat.results.map(item => ({ route: cat.route, item, cat }))
  );
  const shortcutFlat = query ? [] : SHORTCUTS;

  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, [setOpen]);

  const goTo = useCallback((route) => {
    navigate(route);
    close();
  }, [navigate, close]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const max = query ? flat.length : shortcutFlat.length;
        setActiveIdx(i => Math.min(i + 1, max - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (query && flat[activeIdx]) goTo(flat[activeIdx].route);
        else if (!query && shortcutFlat[activeIdx]) goTo(shortcutFlat[activeIdx].route);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flat, shortcutFlat, activeIdx, query, goTo, close]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  if (!open) return null;

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4"
      style={{ background: "rgba(17,24,39,0.6)", backdropFilter: "blur(4px)" }}
      onClick={close}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ border: "1px solid #e5e7eb", maxHeight: "75vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <span className="text-gray-400 text-lg flex-shrink-0">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ketik untuk mencari di semua modul…"
            className="flex-1 text-base text-gray-900 outline-none placeholder-gray-400 bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs text-gray-500 border border-gray-200 rounded-md font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(75vh - 64px)" }}>
          {/* Empty state — shortcuts */}
          {!query && (
            <div className="p-4">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Pintasan Cepat</p>
              <div className="space-y-1">
                {SHORTCUTS.map((sc, i) => (
                  <button
                    key={sc.label}
                    onClick={() => goTo(sc.route)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      activeIdx === i ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{sc.icon}</span>
                    <span className="font-medium">{sc.label}</span>
                    <span className="ml-auto text-gray-400">→</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results */}
          {query && results.length === 0 && (
            <div className="py-12 text-center text-gray-400">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-medium">Tidak ada hasil untuk "{query}"</p>
              <p className="text-sm mt-1">Coba kata kunci lain</p>
            </div>
          )}

          {query && results.length > 0 && results.map(cat => (
            <div key={cat.key} className="px-4 py-3">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                {cat.icon} {cat.label}
              </p>
              <div className="space-y-0.5">
                {cat.results.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={() => goTo(cat.route)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                        activeIdx === idx ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{cat.title(item)}</p>
                        <p className="text-xs text-gray-400 truncate">{cat.sub(item)}</p>
                      </div>
                      <span className="text-gray-400 flex-shrink-0">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
            <span><kbd className="font-mono border border-gray-200 rounded px-1">↑↓</kbd> navigasi</span>
            <span><kbd className="font-mono border border-gray-200 rounded px-1">↵</kbd> buka</span>
            <span><kbd className="font-mono border border-gray-200 rounded px-1">ESC</kbd> tutup</span>
            {query && <span className="ml-auto">{flat.length} hasil</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function GlobalSearchProvider({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <GlobalSearchContext.Provider value={{ open, setOpen }}>
      {children}
      <GlobalSearchModal open={open} setOpen={setOpen} />
    </GlobalSearchContext.Provider>
  );
}

export default GlobalSearchModal;
