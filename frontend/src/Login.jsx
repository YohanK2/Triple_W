import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';
import { getDestinationRoute } from './utils/roles';
import './assets/styles/principal.css';

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombreUsuario.trim() || !contrasena) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // 1. Llamada a FastAPI vía AuthContext
      const usuarioLogueado = await login(nombreUsuario.trim(), contrasena);

      // 2. Notificación de bienvenida con el nombre real de la BD
      showToast(`¡Bienvenido, ${usuarioLogueado.nombres || usuarioLogueado.nombre_usuario}!`, 'success');

      // El panel inicial siempre debe corresponder al rol autenticado.
      navigate(getDestinationRoute(usuarioLogueado.rol_nombre), { replace: true });
    } catch (err) {
      // Captura de mensaje del backend ("Credenciales incorrectas" o "Usuario desactivado")
      const errorMsg = err.message || 'Error al iniciar sesión. Revisa tus credenciales.';
      setError(errorMsg);
      showToast(errorMsg, 'urgent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-icon">
              <Utensils size={28} color="#fff" />
            </div>
            <h1>Restaurant Manager</h1>
            <p>Sistema de Gestión Gastronómica</p>
          </div>

          {error && (
            <div className="error-msg" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Usuario</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  id="username"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  placeholder="Ingresa tu nombre de usuario"
                  required
                  autoFocus
                  autoComplete="username"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  id="password"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login"
              disabled={submitting}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              <strong>Acceso Seguro con JWT</strong>
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Usa las credenciales asignadas por el Administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
