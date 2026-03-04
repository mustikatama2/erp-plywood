import { useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, can } = useAuth();
  const { pathname } = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: pathname }} replace />;

  if (!can(pathname)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-6xl mb-4">🔒</p>
        <h2 className="text-xl font-black text-white mb-2">Akses Ditolak</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Anda tidak memiliki izin untuk mengakses halaman ini.
          Hubungi administrator jika perlu akses ke modul ini.
        </p>
        <p className="text-xs text-gray-600 mt-3 font-mono">{pathname}</p>
      </div>
    );
  }

  return children;
}
