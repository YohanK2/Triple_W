import { Utensils, LogOut } from 'lucide-react';

export default function Sidebar({ brand, roleLabel, user, items, activeId, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="icon"><Utensils size={20} color="#fff" /></div>
        <div>
          <h2>{brand}</h2>
          <small>{roleLabel}</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <a
            key={item.id}
            className={`nav-item ${activeId === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item)}
          >
            <span className="icon">{item.icon}</span> {item.label}
          </a>
        ))}
        <div className="nav-divider" />
        <a className="nav-item" onClick={onLogout}>
          <span className="icon"><LogOut size={18} /></span> Cerrar Sesión
        </a>
      </nav>
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || '?'}</div>
          <div>
            <div className="name">{user?.name}</div>
            <div className="role-label">{roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
