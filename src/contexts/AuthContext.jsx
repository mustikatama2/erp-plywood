import { createContext, useContext, useState, useEffect } from "react";
import { USERS, ROLES, canAccess } from "../data/users";

const AuthCtx = createContext(null);

// Whether we're running against a real backend
const HAS_BACKEND = Boolean(import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "/api_demo");

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = async (username, password) => {
    // ── Real backend login ────────────────────────────────────────────────────
    if (HAS_BACKEND) {
      try {
        const BASE = import.meta.env.VITE_API_URL || "/api";
        const res = await fetch(`${BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error || "Login gagal" };

        localStorage.setItem("erp_token", data.token);
        localStorage.setItem("erp_user",  JSON.stringify(data.user));
        setUser(data.user);
        return { ok: true };
      } catch (e) {
        // If backend unreachable, fall through to demo mode
        console.warn("Backend unreachable, falling back to demo auth");
      }
    }

    // ── Demo / fallback login (seed users) ────────────────────────────────────
    const found = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (!found) return { ok: false, error: "Username atau password salah" };

    const session = {
      id: found.id, username: found.username, name: found.name,
      role: found.role, dept: found.dept, avatar: found.avatar, avatarColor: found.avatarColor,
    };
    localStorage.setItem("erp_user", JSON.stringify(session));
    setUser(session);
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    setUser(null);
  };

  const can = (path) => canAccess(user, path);
  const role = user ? ROLES[user.role] : null;
  const isAdmin = user?.role === "admin";

  return (
    <AuthCtx.Provider value={{ user, role, login, logout, can, isAdmin }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
