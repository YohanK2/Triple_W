import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDestinationRoute } from '../../utils/roles';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. Mientras verifica el token en localStorage, mostramos un spinner
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FDF6E3', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '4px solid #D4A017', borderTopColor: 'transparent', animation: 'login-spin 1s linear infinite' }} />
          <p style={{ fontSize: 13, color: '#7d6d5a', margin: 0 }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // 2. Si no está autenticado, redirigir a Login guardando la ruta previa
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 3. Si se definieron roles específicos y el usuario no pertenece a ninguno
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // El Administrador siempre tiene acceso global como superusuario
    if (user.role !== 'admin') {
      const fallbackRoute = getDestinationRoute(user.rol_nombre);
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return children;
}