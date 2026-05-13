import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, role, loading } = useAuth();

  if (loading) return <div className="app-container" style={{justifyContent: 'center', alignItems: 'center'}}>Loading...</div>;
  if (!user || !['admin', 'superadmin'].includes(role as string)) return <Navigate to="/" replace />;

  return <Outlet />;
};
