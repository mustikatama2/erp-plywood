/**
 * Unified API client
 *
 * In on-prem mode: calls /api/* on the same server (Nginx proxies to Express)
 * In Vercel/cloud mode: can be configured to call Supabase directly
 *
 * The VITE_API_URL env var controls the base URL:
 *   On-prem build:   VITE_API_URL=/api   (same-origin, Nginx proxies)
 *   Dev:             VITE_API_URL=http://localhost:3001/api
 *   Cloud fallback:  falls back to demo seed data if no API
 */

const BASE = import.meta.env.VITE_API_URL || "/api";

// Token stored in localStorage
const getToken = () => localStorage.getItem("erp_token");

async function request(method, path, body) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/login";
    throw new Error("Session expired — please login again");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  patch:  (path, body)   => request("PATCH",  path, body),
  delete: (path)         => request("DELETE", path),

  // Auth
  login:  (username, password) => request("POST", "/auth/login",  { username, password }),
  logout: ()                   => request("POST", "/auth/logout"),
  me:     ()                   => request("GET",  "/auth/me"),

  // Collections
  customers:    () => request("GET", "/customers"),
  vendors:      () => request("GET", "/vendors"),
  products:     () => request("GET", "/products"),
  salesOrders:  (status) => request("GET", `/sales-orders${status ? `?status=${status}` : ""}`),
  purchaseOrders:()=> request("GET", "/purchase-orders"),
  arInvoices:   (status) => request("GET", `/ar-invoices${status ? `?status=${status}` : ""}`),
  apInvoices:   () => request("GET", "/ap-invoices"),
  employees:    () => request("GET", "/employees"),
  assets:       () => request("GET", "/assets"),
  accounts:     () => request("GET", "/accounts?limit=500"),
  bankAccounts: () => request("GET", "/bank-accounts"),
  dashboard:    () => request("GET", "/dashboard"),
};

export default api;
