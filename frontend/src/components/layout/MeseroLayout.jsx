import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ClipboardList, ScrollText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import NewOrderSection from '../../pages/Dashboard_mesero';
import ActiveOrdersSection from '../mesero/ActiveOrdersSection';
import HistorySection from '../mesero/HistorySection';

const NAV_ITEMS = [
  { id: 'new-order', icon: <PlusCircle size={18} />, label: 'Nueva Orden', title: 'Nueva Orden' },
  { id: 'active', icon: <ClipboardList size={18} />, label: 'Órdenes Activas', title: 'Órdenes Activas' },
  { id: 'history', icon: <ScrollText size={18} />, label: 'Historial', title: 'Historial' },
];

export default function MeseroLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState('new-order');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar
        brand="Restaurant"
        roleLabel="Panel Mesero"
        user={user}
        items={NAV_ITEMS}
        activeId={active}
        onNavigate={(item) => setActive(item.id)}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {active === 'new-order' && <NewOrderSection />}
        {active === 'active' && <ActiveOrdersSection />}
        {active === 'history' && <HistorySection />}
      </main>
    </div>
  );
}
