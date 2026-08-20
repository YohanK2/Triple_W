import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDestinationRoute } from '../../utils/roles';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // 1. Mientras verifica el token en localStorage, mostramos un spinner
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Verificando sesión...</p>
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