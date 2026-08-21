import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChefHat, Check, UtensilsCrossed, DollarSign, X, ClipboardList, Store,
  UserRound, Clock3, StickyNote, RefreshCw, CreditCard,
} from 'lucide-react';

import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { useOrders, ORDER_STATES, orderTotal } from '../../context/ordersCore';

import { Trash2 } from 'lucide-react';
import { formatMoney } from '../../services/format';
import '../../styles/Orders.css';

const FILTER_META = {
  todas: { label: 'Todas', icon: ClipboardList },
  pendiente: { label: 'Pendientes', icon: Clock3 },
  preparacion: { label: 'En preparación', icon: ChefHat },
  lista: { label: 'Listas', icon: Check },
  entregada: { label: 'Entregadas', icon: UtensilsCrossed },
  pagada: { label: 'Pagadas', icon: DollarSign },
  cancelada: { label: 'Canceladas', icon: X },
};

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

function OrderCard({ order, onCancel, onDelete, onAdvance, onPayOrder }) {
  const canCancel = order.estado === 'pendiente' || order.estado === 'preparacion';
  const canAdvance = order.estado === 'lista';
  const canGoToCajero = order.estado === 'entregada';
  const meta = ORDER_STATES[order.estado];
  const total = orderTotal(order);
  const isZeroTotal = total === 0;

  return (
    <motion.div className="ord-card" variants={cardVariants} layout>
      <div className="ord-card-top">
        <span className="ord-id"><ClipboardList size={15} color="var(--gold)" /> Orden #{order.id}</span>
        <span className={`ord-status ${order.estado}`}>{meta.label}</span>
        <div className="ord-meta">
          <span><Store size={13} /> Mesa {order.mesa}</span>
          <span><UserRound size={13} /> {order.mesero}</span>
          <span><Clock3 size={13} /> {order.hora}</span>
        </div>
      </div>

      <div className="ord-items">
        {order.items.map((i) => (
          <span className="ord-item-chip" key={i.id || i.nombre}>
            <b>{i.cantidad}×</b> {i.nombre}
          </span>
        ))}
      </div>

      {order.notas && (
        <div className="ord-note"><StickyNote size={13} /> {order.notas}</div>
      )}

      <div className="ord-card-bottom">
        <div className="ord-total"><small>Total</small>{formatMoney(total)}</div>
        <div className="ord-actions">
          {canCancel && (
            <motion.button
              type="button" className="ghost-btn" onClick={() => onCancel(order.id)}
              whileTap={{ scale: 0.97 }}
            >
              <X size={14} /> Cancelar
            </motion.button>
          )}
          {canAdvance && (
            <motion.button
              type="button" className="primary-btn" onClick={() => onAdvance(order.id)}
              whileTap={{ scale: 0.97 }}
            >
              <Check size={14} /> Entregar
            </motion.button>
          )}
          {canGoToCajero && (
            <motion.button
              type="button" className="primary-btn" onClick={() => onPayOrder(order)}
              whileTap={{ scale: 0.97 }}
              style={{ background: 'var(--gold)', color: 'var(--brown)', borderColor: 'var(--gold)' }}
            >
              <CreditCard size={14} /> Cobrar
            </motion.button>
          )}
          {isZeroTotal && (
            <motion.button
              type="button" className="ghost-btn danger" onClick={() => onDelete(order.id)}
              whileTap={{ scale: 0.97 }}
            >
              <Trash2 size={14} /> Eliminar
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Orders() {
  const { orders, loading, cancelOrder, deleteOrder, advanceOrder, refresh, payOrder } = useOrders();
  const { showToast } = useToast();
  const [filtro, setFiltro] = useState('todas');

  const filtradas = useMemo(
    () => (filtro === 'todas' ? orders : orders.filter((o) => o.estado === filtro)),
    [orders, filtro],
  );

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      showToast(`Orden #${id} cancelada`, 'success');
    } catch (err) {
      showToast(err.message || 'Error cancelando la orden', 'urgent');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar permanentemente esta comanda en 0?')) return;
    try {
      await deleteOrder(id);
      showToast(`Orden #${id} eliminada`, 'success');
    } catch (err) {
      showToast(err.message || 'Error eliminando la orden', 'urgent');
    }
  };

  const handleAdvance = async (id) => {
    try {
      await advanceOrder(id);
      showToast(`Orden #${id} actualizada`, 'success');
    } catch (err) {
      showToast(err.message || 'Error actualizando orden', 'urgent');
    }
  };

  const handlePayOrder = async (order) => {
    const metodo = window.prompt('Método de pago (efectivo/tarjeta/transferencia):', 'efectivo');
    if (!metodo) return;
    const referencia = window.prompt('Referencia (opcional):', '');
    try {
      await payOrder(order.id, metodo, referencia || '');
      showToast(`Orden #${order.id} cobrada`, 'success');
    } catch (err) {
      showToast(err.message || 'Error cobrando la orden', 'urgent');
    }
  };

  return <>
    <PageIntro
      eyebrow="Operación"
      title="Órdenes"
      description="Todas las comandas del salón con su estado en tiempo real, desde que se envían a cocina hasta que se cobran."
      action={<button className="ghost-btn" onClick={refresh} disabled={loading}><RefreshCw size={17} /> Actualizar</button>}
    />

    <div className="quick-actions">
      {Object.entries(FILTER_META).map(([key, { label, icon: Icon }]) => {
        const count = key === 'todas'
          ? orders.length
          : orders.filter((o) => o.estado === key).length;
        return (
          <button
            key={key} type="button"
            className={`filter-chip ${filtro === key ? 'active' : ''}`}
            onClick={() => setFiltro(key)}
          >
            <Icon size={14} /> {label}
            <b style={{ color: 'var(--gold)' }}>{count}</b>
          </button>
        );
      })}
    </div>

    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Comandas del salón</h3>
          <p>{filtradas.length} {filtradas.length === 1 ? 'orden' : 'órdenes'} en la vista actual</p>
        </div>
        <ClipboardList size={20} />
      </div>

      {filtradas.length === 0 ? (
        <EmptyPanel
          title={loading ? 'Cargando órdenes...' : 'Sin órdenes aquí'}
          text="Cuando se envíen comandas desde «Nueva orden» aparecerán en esta vista."
        />
      ) : (
        <motion.div className="ord-list" key={filtro} variants={listVariants} initial="hidden" animate="show">
          <AnimatePresence>
            {filtradas.map((o) => (
              <OrderCard key={o.id} order={o} onCancel={handleCancel} onDelete={handleDelete} onAdvance={handleAdvance} onPayOrder={handlePayOrder} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  </>;
}
