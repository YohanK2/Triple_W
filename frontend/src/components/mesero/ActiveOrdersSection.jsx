import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Check, Hourglass, ChefHat, ClipboardList, Eye, BellRing } from 'lucide-react';
import { ordenesService } from '../../services';
import { formatMoney, timeAgo } from '../../services/format';
import { useToast } from '../Toast';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';
import OrderDetailModal from '../OrderDetailModal';
import EmptyState from '../EmptyState';

const POLL_INTERVAL = 5000; // Sondeo cada 5 segundos

export default function ActiveOrdersSection() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar órdenes activas (excluyendo órdenes ya servidas, pagadas o canceladas)
  const loadOrders = useCallback(async () => {
    try {
      const data = await ordenesService.getOrdenes();
      if (Array.isArray(data)) {
        const propias = user?.role === 'admin'
          ? data
          : data.filter((o) => o.id_mesero === user?.id_usuario);
        const activas = propias.filter(
          (o) => !['servido', 'pagado', 'cancelado', 'served', 'paid', 'cancelled'].includes(o.estado)
        );
        // Ordenar: primero las listas para servir, luego en preparación, luego pendientes
        activas.sort((a, b) => (b.id_orden || 0) - (a.id_orden || 0));
        setOrders(activas);
      }
    } catch (err) {
      console.error('Error al cargar órdenes activas:', err);
    }
  }, [user]);

  useEffect(() => {
    const initialLoad = setTimeout(loadOrders, 0);
    const interval = setInterval(loadOrders, POLL_INTERVAL);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }

  // Marcar comanda como servida en la mesa
  async function markServed(order) {
    try {
      await ordenesService.updateOrden(order.id_orden, {
        ...order,
        estado: 'servido',
      });
      showToast(`Comanda #${order.id_orden} marcada como servida`, 'success', `Mesa #${order.id_mesa}`);
      loadOrders();
    } catch (err) {
      showToast(err.message || 'Error al actualizar estado', 'urgent');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Comandas Activas</h1>
          <p className="subtitle">Monitoreo en tiempo real del estado de los pedidos</p>
        </div>
        <button
          className={`btn btn-ghost btn-sm btn-refresh ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <span className="refresh-icon"><RefreshCw size={16} /></span>
          Actualizar
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={24} />}
          title="No hay comandas activas en este momento"
          description="Las nuevas órdenes enviadas desde la toma de pedidos aparecerán aquí."
        />
      ) : (
        <div className="order-queue" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {orders.map((o) => {
            const isReady = o.estado === 'listo' || o.estado === 'ready';
            const isPreparing = o.estado === 'preparando' || o.estado === 'preparing';

            return (
              <div
                className={`order-card ${isReady ? 'pulse-border' : ''}`}
                key={o.id_orden}
                style={{
                  border: isReady ? '2px solid var(--success)' : '1px solid var(--border)',
                  position: 'relative',
                }}
              >
                {isReady && (
                  <div
                    style={{
                      background: 'var(--success)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <BellRing size={13} /> ¡PLATILLO LISTO PARA SERVIR!
                  </div>
                )}

                <div className="order-card-header">
                  <span className="order-number">Comanda #{o.id_orden}</span>
                  <span className="table-badge">Mesa #{o.id_mesa || 'Barra'}</span>
                </div>

                <div className="flex-between mb-2" style={{ alignItems: 'center', marginTop: '0.5rem' }}>
                  <StatusBadge status={o.estado} />
                  <span className="order-time">{timeAgo(o.creado_en)}</span>
                </div>

                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', margin: '0.6rem 0' }}>
                  {formatMoney(o.total)}
                </div>

                {o.notas && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-muted)', padding: '0.4rem', borderRadius: '4px', marginBottom: '0.8rem' }}>
                    Nota: {o.notas}
                  </p>
                )}

                <div className="order-footer" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <Eye size={15} /> Ver Detalle
                  </button>

                  {isReady && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1.3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => markServed(o)}
                    >
                      <Check size={16} /> Servir Mesa
                    </button>
                  )}

                  {isPreparing && (
                    <span className="text-icon" style={{ fontSize: '0.8rem', color: 'var(--info)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ChefHat size={14} /> En cocina
                    </span>
                  )}

                  {(!isReady && !isPreparing) && (
                    <span className="text-icon" style={{ fontSize: '0.8rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Hourglass size={14} /> En espera
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
