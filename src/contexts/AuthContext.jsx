import { createContext, useContext, useState, useEffect } from "react";
import { USERS, ROLES, canAccess } from "../data/users";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("erp_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const login = (username, password) => {
    const found = USERS.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );
    if (found) {
      const session = { id: found.id, username: found.username, name: found.name, role: found.role, dept: found.dept, avatar: found.avatar, avatarColor: found.avatarColor };
      localStorage.setItem("erp_user", JSON.stringify(session));
      setUser(session);
      return { ok: true };
    }
    return { ok: false, error: "Username atau password salah" };
  };

  const logout = () => {
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
