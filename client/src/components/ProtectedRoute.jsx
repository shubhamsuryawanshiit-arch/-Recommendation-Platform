import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
export default function ProtectedRoute({ admin = false }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loading"><span className="spinner" /> Getting your space ready…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
