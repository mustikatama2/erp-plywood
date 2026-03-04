import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { USERS, ROLES } from "../../data/users";
import { COMPANY } from "../../data/seed";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) { setError("Harap isi username dan password"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400)); // small artificial delay for UX
    const result = login(form.username, form.password);
    setLoading(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  };

  const quickLogin = (username, password) => {
    setForm({ username, password });
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-5xl">🪵</span>
          </div>
          <h1 className="text-2xl font-black text-white">{COMPANY.short}</h1>
          <p className="text-gray-500 text-sm mt-1">Sistem ERP — Masuk ke akun Anda</p>
        </div>

        {/* Login form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="erp-label">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={set("username")}
                placeholder="Masukkan username"
                className="erp-input"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="erp-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Masukkan password"
                  className="erp-input pr-12"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm">
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm active:scale-95">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Masuk…
                </span>
              ) : "🔐 Masuk"}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">
            Akun Demo — klik untuk login cepat
          </p>
          <div className="space-y-2">
            {USERS.map(u => {
              const role = ROLES[u.role];
              return (
                <button key={u.id} onClick={() => quickLogin(u.username, u.password)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border border-gray-800 hover:border-blue-600/50 hover:bg-gray-800/50 transition-all text-left group ${
                    form.username === u.username ? "border-blue-600/50 bg-blue-600/10" : ""
                  }`}>
                  <div className={`w-8 h-8 rounded-full ${u.avatarColor} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 truncate">{role?.labelBI}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-mono text-xs text-gray-400">{u.username}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${role?.color}`}>
                      {role?.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-3 text-center">
            Semua password demo: <span className="font-mono text-gray-500">[username]123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
