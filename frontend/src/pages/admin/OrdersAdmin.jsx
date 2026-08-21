import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock3, ChefHat, Check, UtensilsCrossed, Store, UserRound, Zap,
} from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { useOrders, ORDER_STATES, orderTotal } from '../../context/ordersCore';
import { formatMoney } from '../../services/format';
import '../../styles/Orders.css';

export default function OrdersAdmin() {
  const { orders, loading, cancelOrder } = useOrders();
  const { showToast } = useToast();

  const stats = useMemo(() => ({
    total: orders.length,
    activas: orders.filter((o) => !['pagada', 'cancelada'].includes(o.estado)).length,
    pendientes: orders.filter((o) => o.estado === 'pendiente').length,
    preparacion: orders.filter((o) => o.estado === 'preparacion').length,
    listas: orders.filter((o) => o.estado === 'lista').length,
    recaudo: orders.filter((o) => o.estado === 'pagada').reduce((s, o) => s + orderTotal(o), 0),
  }), [orders]);

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      showToast(`Orden #${id} cancelada`, 'success');
    } catch (err) {
      showToast(err.message || 'Error cancelando la orden', 'urgent');
    }
  };

  return <>
    <PageIntro
      eyebrow="Administración"
      title="Órdenes"
      description="Monitoreo informativo de todas las comandas generadas por los meseros, sincronizado en tiempo real con el salón."
    />

    <div className="ord-stats">
      <div className="ord-stat">
        <span className="ord-stat-icon brown"><ClipboardList size={17} /></span>
        <div><strong>{loading ? '…' : stats.total}</strong><small>Órdenes totales</small></div>
      </div>
      <div className="ord-stat">
        <span className="ord-stat-icon amber"><Clock3 size={17} /></span>
        <div><strong>{stats.pendientes}</strong><small>Pendientes</small></div>
      </div>
      <div className="ord-stat">
        <span className="ord-stat-icon gold"><ChefHat size={17} /></span>
        <div><strong>{stats.preparacion}</strong><small>En preparación</small></div>
      </div>
      <div className="ord-stat">
        <span className="ord-stat-icon green"><Check size={17} /></span>
        <div><strong>{stats.listas}</strong><small>Listas para servir</small></div>
      </div>
      <div className="ord-stat">
        <span className="ord-stat-icon gold"><Zap size={17} /></span>
        <div><strong>{formatMoney(stats.recaudo)}</strong><small>Recaudo pagado</small></div>
      </div>
    </div>

    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Comandas en vivo</h3>
          <p>{stats.activas} activas · reflejando cada cambio de estado hecho en el salón</p>
        </div>
        <ClipboardList size={20} />
      </div>

      {orders.length === 0 ? (
        <EmptyPanel title={loading ? 'Cargando órdenes...' : 'Sin órdenes registradas'} text="Las comandas que creen los meseros aparecerán aquí automáticamente." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Orden</th>
                <th>Mesa</th>
                <th>Mesero</th>
                <th>Artículos</th>
                <th>Total</th>
                <th>Hora</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const meta = ORDER_STATES[o.estado];
                const canCancel = o.estado === 'pendiente' || o.estado === 'preparacion';
                return (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                  >
                    <td><strong>#{o.id}</strong></td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Store size={13} /> {o.mesa}</span></td>
                    <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><UserRound size={13} /> {o.mesero}</span></td>
                    <td style={{ maxWidth: 260 }}>
                      {o.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(' · ')}
                    </td>
                    <td><strong>{formatMoney(orderTotal(o))}</strong></td>
                    <td>{o.hora}</td>
                    <td><span className={`ord-status sm ${o.estado}`}>{meta.label}</span></td>
                    <td>
                      {canCancel && (
                        <button
                          type="button" className="category-toggle-btn deactivate"
                          onClick={() => handleCancel(o.id)}
                          title="Cancelar orden"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </>;
}
