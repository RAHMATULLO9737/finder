import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// admin=true bo'lsa — faqat admin (is_staff) kira oladi
export default function Protected({ admin = false, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container"><div className="empty">Yuklanmoqda...</div></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && !user.is_staff) return <Navigate to="/" replace />;
  return children;
}
