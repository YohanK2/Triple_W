import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Login from './Login';
import AdminLayout from './components/layout/AdminLayout';
import MeseroLayout from './components/layout/MeseroLayout';
import Cocinero from './pages/Cocinero';
import { getDestinationRoute } from './utils/roles';

function ProtectedRoute({ roles, children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={getDestinationRoute(user.rol_nombre)} replace />;
  }

  return children;
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getDestinationRoute(user.rol_nombre)} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/mesero/*"
            element={
              <ProtectedRoute roles={['admin', 'mesero']}>
                <MeseroLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Cocinero/*"
            element={
              <ProtectedRoute roles={['admin', 'cocinero']}>
                <Cocinero />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}