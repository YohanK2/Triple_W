import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { normalizeRole } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inicializar sesión al arrancar la app leyendo localStorage
  useEffect(() => {
    try {
      const storedToken = authService.getStoredToken();
      const storedUser = authService.getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser({
          ...storedUser,
          role: normalizeRole(storedUser.rol_nombre),
        });
      }
    } catch (e) {
      console.error('Error al restaurar sesión:', e);
      authService.logout();
    } finally {
      setLoading(false);
    }
  }, []);

  // Función de Login contra FastAPI
  const login = useCallback(async (nombre_usuario, contrasena) => {
    const data = await authService.login(nombre_usuario, contrasena);
    
    const formattedUser = {
      ...data.usuario,
      role: normalizeRole(data.usuario.rol_nombre),
    };

    setToken(data.token);
    setUser(formattedUser);

    return formattedUser;
  }, []);

  // Función de Logout
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}