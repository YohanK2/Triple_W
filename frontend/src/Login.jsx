import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, LockKeyhole, ShoppingCart, Store, UserRound, UsersRound, Boxes,
  AlertCircle, Loader2,
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useToast } from './components/Toast';
import { getDestinationRoute } from './utils/roles';
import logo from './assets/logo-triple-w.png';
import foods from './assets/alimentos.png';
import './assets/styles/login.css';

const features = [
  { title: <>Registro<br />de Ventas</>, icon: ShoppingCart },
  { title: <>Control de<br />Inventario</>, icon: Boxes },
  { title: <>Gestión de<br />Clientes</>, icon: UsersRound },
];

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({ user: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const nombreUsuario = values.user.trim();
    const contrasena = values.password;

    if (!nombreUsuario || !contrasena) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const usuarioLogueado = await login(nombreUsuario, contrasena);

      showToast(`¡Bienvenido, ${usuarioLogueado.nombres || usuarioLogueado.nombre_usuario}!`, 'success');

      navigate(getDestinationRoute(usuarioLogueado.rol_nombre), { replace: true });
    } catch (err) {
      const errorMsg = err.message || 'Error al iniciar sesión. Revisa tus credenciales.';
      setError(errorMsg);
      showToast(errorMsg, 'urgent');
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgot() {
    showToast('Contacta al administrador para restablecer tu contraseña', 'info');
  }

  return (
    <div className="login-page">
      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <header className="login-navbar">
        <div className="login-pill">
          <div className="nav-dots left" />
          <div className="nav-line left" />
          <div className="nav-line right" />
          <div className="nav-dots right" />
          <div className="login-emblem">
            <img src={logo} alt="Logo Triple W" />
          </div>
        </div>
      </header>

      <main className="login-main">
        <section className="login-branding">
          <div className="flame-decoration" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="login-brand-copy">
            <h1>¡Bienvenido al<br />Gestor de Ventas <span>Triple W!</span></h1>
            <p>Controla, organiza y hace crecer tu negocio con nuestra plataforma de gestión de ventas, diseñada para tu comodidad.</p>
            <div className="login-feature-grid">
              {features.map(({ title, icon: Icon }) => (
                <div className="login-feature-card" key={title.props.children.join('')}>
                  <div className="feature-icon"><Icon size={28} strokeWidth={1.8} /></div>
                  <strong>{title}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-icon"><Store size={36} strokeWidth={1.8} /></div>
          <h2>Accede a tu cuenta</h2>
          <p>Gestiona todas las operaciones<br />desde un solo lugar.</p>

          {error && (
            <div className="login-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="login-field">
              <UserRound size={20} />
              <input
                type="text"
                value={values.user}
                onChange={(e) => setValues({ ...values, user: e.target.value })}
                placeholder="Usuario"
                autoComplete="username"
                autoFocus
                disabled={submitting}
              />
            </label>

            <label className="login-field">
              <LockKeyhole size={20} />
              <input
                value={values.password}
                onChange={(e) => setValues({ ...values, password: e.target.value })}
                placeholder="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar contraseña"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </label>

            <button className="login-submit" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LockKeyhole size={18} /> Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <button className="forgot-link" type="button" onClick={handleForgot}>
            ¿Olvidaste tu contraseña?
          </button>
        </section>
      </main>

      <section className="login-promo">
        <div className="promo-copy">
          <div className="promo-flame">♨</div>
          <p>¡Más ventas, mejor control,<br /><strong>mayores resultados!</strong></p>
        </div>
        <div className="promo-food">
          <img src={foods} alt="Productos de Triple W" />
        </div>
      </section>
    </div>
  );
}
