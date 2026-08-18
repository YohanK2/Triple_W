import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Banknote, Sandwich, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/layout/Sidebar';
import AppHeader from '../../components/layout/AppHeader';
import DashboardSection from './DashboardSection';
import OrdersSection from './OrdersSection';
import RevenueSection from './RevenueSection';
import MenuSection from './MenuSection';
import UsersSection from './UsersSection';

const NAV_ITEMS = [
  { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', title: 'Dashboard' },
  { id: 'orders', icon: <ClipboardList size={18} />, label: 'Órdenes', title: 'Historial de Órdenes' },
  { id: 'revenue', icon: <Banknote size={18} />, label: 'Ingresos', title: 'Reporte de Ingresos' },
  { id: 'menu', icon: <Sandwich size={18} />, label: 'Menú', title: 'Gestión del Menú' },
  { id: 'users', icon: <Users size={18} />, label: 'Usuarios', title: 'Gestión de Usuarios' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('dashboard');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sectionTitle = NAV_ITEMS.find((i) => i.id === active)?.title || 'Dashboard';

  return (
    <>
      <AppHeader sectionTitle={sectionTitle} user={user} onLogout={handleLogout} />
      <div className="app-layout">
        <Sidebar
          brand="Restaurant"
          roleLabel="Panel Admin"
          user={user}
          items={NAV_ITEMS}
          activeId={active}
          onNavigate={(item) => setActive(item.id)}
          onLogout={handleLogout}
        />
        <main className="main-content">
          {active === 'dashboard' && <DashboardSection onNavigate={setActive} />}
          {active === 'orders' && <OrdersSection />}
          {active === 'revenue' && <RevenueSection />}
          {active === 'menu' && <MenuSection />}
          {active === 'users' && <UsersSection />}
        </main>
      </div>
    </>
  );
}
