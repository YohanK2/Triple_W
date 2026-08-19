import { useState, useEffect, useRef } from 'react';
import { roleLabel } from '../../services/format';

export default function AppHeader({ sectionTitle, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="section-title">{sectionTitle}</div>
        <div className="welcome-text">Bienvenido, {user?.name}</div>
      </div>
      <div className="header-right" ref={ref}>
        <button
          type="button"
          className="profile-button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
        >
          <span className="profile-avatar">{user?.name?.charAt(0).toUpperCase() || '?'}</span>
          <span className="profile-info">
            <strong>{user?.name}</strong>
            <small>{roleLabel(user?.role)}</small>
          </span>
          <span className="profile-caret">▾</span>
        </button>
        <div className={`profile-menu ${menuOpen ? 'active' : ''}`}>
          <a href="#" onClick={(e) => e.preventDefault()}>Mi perfil</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Configuración</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>Cerrar sesión</a>
        </div>
      </div>
    </header>
  );
}
