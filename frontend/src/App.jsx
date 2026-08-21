import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import OrdersProvider from './context/OrdersProvider';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Login from './Login';
import { getDestinationRoute } from './utils/roles';

import Dashboard from './pages/admin/Dashboard';
import Sales from './pages/admin/Sales';
import OrdersAdmin from './pages/admin/OrdersAdmin';
import Products from './pages/admin/Products';
import Categorias from './pages/admin/Categorias';
import Clients from './pages/admin/Clients';
import Reports from './pages/admin/Reports';
import Inventory from './pages/admin/Inventory';
import Purchases from './pages/admin/Purchases';
import Users from './pages/admin/Users';
import Notifications from './pages/admin/Notifications';
import ReservasActivas from './pages/admin/Reservas';

import Salon from './pages/mesero/Salon';
import NewOrder from './pages/mesero/NewOrder';
import Orders from './pages/mesero/Orders';
import Reservas from './pages/mesero/Reservas';
import Kitchen from './pages/kitchen/Kitchen';
import CajeroAdmin from './pages/admin/Cajero';

function VisualRoute({ children, section, title }) {
  return (
    <AppShell section={section} title={title}>
      {children}
    </AppShell>
  );
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getDestinationRoute(user.rol_nombre)} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <OrdersProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Resumen general"><Dashboard /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/ventas" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Ventas"><Sales /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/ordenes" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Órdenes"><OrdersAdmin /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/productos" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Productos"><Products /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/categorias" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Categorías"><Categorias /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/clientes" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Clientes"><Clients /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/reportes" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Reportes"><Reports /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/inventario" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Inventario"><Inventory /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/proveedores" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Proveedores y compras"><Purchases /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Usuarios y roles"><Users /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/admin/notificaciones" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Administración" title="Notificaciones"><Notifications /></VisualRoute></ProtectedRoute>
            } />

            <Route path="/mesero" element={
              <ProtectedRoute roles={['admin', 'mesero']}><VisualRoute section="Salón" title="Salón y mesas"><Salon /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/mesero/nueva-orden" element={
              <ProtectedRoute roles={['admin', 'mesero']}><VisualRoute section="Salón" title="Nueva orden"><NewOrder /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/mesero/ordenes" element={
              <ProtectedRoute roles={['admin', 'mesero']}><VisualRoute section="Operación" title="Órdenes"><Orders /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/mesero/reservas" element={
              <ProtectedRoute roles={['admin', 'mesero']}><VisualRoute section="Operación" title="Reservas"><Reservas /></VisualRoute></ProtectedRoute>
            } />

            <Route path="/kitchen" element={
              <ProtectedRoute roles={['admin', 'cocinero']}><VisualRoute section="Cocina" title="Pantalla de cocina"><Kitchen /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/cashier" element={
              <ProtectedRoute roles={['admin', 'cajero']}><VisualRoute section="Caja" title="Cobro y facturación"><CajeroAdmin /></VisualRoute></ProtectedRoute>
            } />
            <Route path="/reservas" element={
              <ProtectedRoute roles={['admin']}><VisualRoute section="Operación" title="Reservas"><ReservasActivas /></VisualRoute></ProtectedRoute>
            } />

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </OrdersProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
