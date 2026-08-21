import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3, Bell, Boxes, ChevronDown, ClipboardList, Tag,
  LayoutDashboard, LogOut, Menu, Receipt, ShoppingBag,
  Store, Users, UtensilsCrossed, WalletCards, X, ChefHat, UserRound, CalendarClock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDestinationRoute } from '../../utils/roles';
import logo from '../../assets/logo-triple-w.png';

/* Cada item define los roles que pueden verlo. admin ve todo. */
const GROUPS = [
  {
    label: 'Principal',
    roles: ['admin'],
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'], end: true },
      { to: '/admin/ventas', label: 'Ventas', icon: Receipt, roles: ['admin'] },
      { to: '/admin/ordenes', label: 'Órdenes', icon: ClipboardList, roles: ['admin'] },
      { to: '/admin/productos', label: 'Productos', icon: UtensilsCrossed, roles: ['admin'] },
      { to: '/admin/categorias', label: 'Categorías', icon: Tag, roles: ['admin'] },
      { to: '/admin/clientes', label: 'Clientes', icon: Users, roles: ['admin'] },
      { to: '/admin/reportes', label: 'Reportes', icon: BarChart3, roles: ['admin'] },
    ],
  },
  {
    label: 'Operación',
    roles: ['admin', 'mesero', 'cocinero', 'cajero'],
    items: [
      { to: '/server', label: 'Salón y mesas', icon: Store, roles: ['admin', 'mesero'], end: true },
      { to: '/server/ordenes', label: 'Órdenes', icon: ClipboardList, roles: ['admin', 'mesero'] },
      { to: '/server/reservas', label: 'Reservas', icon: CalendarClock, roles: ['admin', 'mesero'] },
      { to: '/kitchen', label: 'Cocina', icon: ChefHat, roles: ['admin', 'cocinero'], end: true },
      { to: '/cashier', label: 'Caja', icon: WalletCards, roles: ['admin', 'cajero'], end: true },
    ],
  },
  {
    label: 'Administración',
    roles: ['admin'],
    items: [
      { to: '/admin/inventario', label: 'Inventario', icon: Boxes, roles: ['admin'] },
      { to: '/admin/proveedores', label: 'Proveedores', icon: ShoppingBag, roles: ['admin'] },
      { to: '/admin/usuarios', label: 'Usuarios y roles', icon: UserRound, roles: ['admin'] },
      { to: '/admin/notificaciones', label: 'Notificaciones', icon: Bell, roles: ['admin'] },
    ],
  },
];

const ROLE_LABELS = { admin: 'Administrador', mesero: 'Mesero', cocinero: 'Cocinero', cajero: 'Cajero' };

export default function AppShell({ children, section, title }) {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.role || 'mesero';
  const initials = (user?.nombres || user?.nombre_usuario || '?').charAt(0).toUpperCase();
  const fullName = `${user?.nombres || ''} ${user?.apellidos || ''}`.trim() || user?.nombre_usuario || 'Usuario';

  const visibleGroups = GROUPS
    .filter((g) => g.roles.includes(role))
    .map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role) || role === 'admin') }))
    .filter((g) => g.items.length > 0);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo-wrap">
            <img src={logo} alt="Triple W" />
          </div>
          <div>
            <strong>Triple W</strong>
            <span>Gestor de Ventas</span>
          </div>
          <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
        </div>

        <nav className="sidebar-nav">
          {visibleGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-menu">
            <button
              className="side-profile"
              onClick={() => setProfileOpen((v) => !v)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              type="button"
            >
              <span className="avatar">{initials}</span>
              <span><strong>{fullName}</strong><small>{ROLE_LABELS[role] || user?.rol_nombre}</small></span>
              <motion.span animate={{ rotate: profileOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown size={15} />
              </motion.span>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <>
                  <button
                    className="sidebar-overlay profile-overlay"
                    onClick={() => setProfileOpen(false)}
                    aria-label="Cerrar menú de perfil"
                    type="button"
                  />
                  <motion.div
                    className="profile-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                    role="menu"
                  >
                    {role === 'admin' && (
                      <button className="profile-dropdown-item" role="menuitem" type="button"
                        onClick={() => { setProfileOpen(false); navigate('/admin/notificaciones'); }}
                      >
                        <Bell size={16} /> Notificaciones
                      </button>
                    )}
                    <button className="profile-dropdown-item" role="menuitem" type="button"
                      onClick={() => { setProfileOpen(false); navigate(getDestinationRoute(user?.rol_nombre)); }}
                    >
                      <UserRound size={16} /> Mi perfil
                    </button>
                    <div className="profile-dropdown-divider" />
                    <button className="profile-dropdown-item logout" role="menuitem" type="button" onClick={handleLogout}>
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Cerrar menú" type="button" />}

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button className="menu-toggle" onClick={() => setOpen(true)} aria-label="Abrir menú"><Menu size={21} /></button>
            <div>
              <span className="eyebrow">{section}</span>
              <h1>{title}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            {role === 'admin' && (
              <button className="icon-button" onClick={() => navigate('/admin/notificaciones')} aria-label="Notificaciones" type="button">
                <Bell size={19} />
                <span className="notification-dot" />
              </button>
            )}
            <div className="top-user">
              <span className="avatar">{initials}</span>
              <span><strong>{fullName}</strong><small>{ROLE_LABELS[role] || user?.rol_nombre}</small></span>
            </div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
