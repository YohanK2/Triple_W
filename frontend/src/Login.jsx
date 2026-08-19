import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';
import { roleLabel } from './services/format';

import './assets/styles/principal.css';

const DASHBOARD_BY_ROLE = {
  admin: '/admin',
  server: '/server',
  cook: '/kitchen',
};

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(username.trim(), password);
      const dest = DASHBOARD_BY_ROLE[user.role] || '/login';
      showToast(`Bienvenido, ${user.name}`, 'success');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Usuario o contraseña incorrectos');
      showToast(err.message || 'Error al iniciar sesión', 'urgent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon"><Utensils size={28} color="#fff" /></div>
          <h1>Restaurant Manager</h1>
          <p>Sistema de Gestión de Órdenes</p>
        </div>

        {error ? <div className="error-msg">{error}</div> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" name="login" className="btn btn-primary btn-login" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <strong>Cuentas de prueba:</strong>
          </p>
          <p>admin / admin123 · server1 / server123 · cook1 / cook123</p>
        </div>
        </div>
      </div>
    </div>
  );
}
