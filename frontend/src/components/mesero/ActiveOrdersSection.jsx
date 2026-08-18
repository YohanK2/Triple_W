import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Check, Banknote, Hourglass, ChefHat, ClipboardList } from 'lucide-react';
import { api } from '../../api';
import { formatMoney, timeAgo } from '../../utils/format';
import { useToast } from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

const POLL_MS = 10000;

export default function ActiveOrdersSection() {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payModal, setPayModal] = useState(null); // { orderId, total }
  const [payMethod, setPayMethod] = useState('cash');
  const [payReference, setPayReference] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([api.getNotifications(), api.getOrders({})]);
    if (results[0].status === 'fulfilled') setNotifications(results[0].value || []);
    if (results[1].status === 'fulfilled') {
      const all = results[1].value || [];
      setOrders(all.filter((o) => !['paid', 'cancelled'].includes(o.status)));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function markServed(orderId) {
    try {
      await api.updateOrderStatus(orderId, 'served');
      showToast('Orden marcada como servida', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error', 'urgent');
    }
  }

  function openPayment(orderId, total) {
    setPayModal({ orderId, total });
    setPayMethod('cash');
    setPayReference('');
  }

  async function processPayment() {
    if (!payModal) return;
    setPaying(true);
    try {
      await api.processPayment(payModal.orderId, payMethod, payReference);
      showToast('Pago procesado exitosamente', 'success');
      setPayModal(null);
      load();
    } catch (err) {
      showToast(err.message || 'Error al procesar pago', 'urgent');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Órdenes Activas</h1>
          <p className="subtitle">Tus órdenes en proceso</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={16} /> Actualizar</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {notifications.map((n, i) => (
          <div key={i} className={`toast ${n.urgency}`} style={{ position: 'relative', animation: 'none', marginBottom: '0.5rem' }}>
            <div className="toast-title">{n.message}</div>
            {n.detail ? <div className="toast-detail">{n.detail}</div> : null}
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={<ClipboardList size={22} />} title="No tienes órdenes activas" />
      ) : (
        <div className="order-queue">
          {orders.map((o) => (
            <div className="order-card" key={o.id}>
              <div className="order-card-header">
                <span className="order-number">Orden #{o.id}</span>
                <span className="table-badge">Mesa {o.table_number}</span>
              </div>
              <div className="flex-between mb-2">
                <StatusBadge status={o.status} />
                <span className="order-time">{timeAgo(o.created_at)}</span>
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', margin: '0.5rem 0' }}>
                {formatMoney(o.total)}
              </div>
              <div className="order-footer">
                {o.status === 'ready' && (
                  <button className="btn btn-success btn-sm" onClick={() => markServed(o.id)}><Check size={16} /> Marcar Servida</button>
                )}
                {o.status === 'served' && (
                  <button className="btn btn-primary btn-sm" onClick={() => openPayment(o.id, o.total)}><Banknote size={16} /> Cobrar</button>
                )}
                {o.status === 'pending' && <span className="text-icon" style={{ fontSize: '0.8rem', color: 'var(--warning)' }}><Hourglass size={14} /> En espera de cocina</span>}
                {o.status === 'preparing' && <span className="text-icon" style={{ fontSize: '0.8rem', color: 'var(--info)' }}><ChefHat size={14} /> Preparando...</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {payModal && (
        <Modal title="Procesar Pago" onClose={() => setPayModal(null)}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', textAlign: 'center', margin: '1rem 0' }}>
            {formatMoney(payModal.total)}
          </div>
          <div className="form-group">
            <label>Método de Pago</label>
            <select className="form-control" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option value="cash">Efectivo</option>
              <option value="card">Tarjeta</option>
              <option value="transfer">Transferencia</option>
            </select>
          </div>
          <div className="form-group">
            <label>Referencia (opcional)</label>
            <input type="text" className="form-control" placeholder="Número de referencia" value={payReference} onChange={(e) => setPayReference(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button className="btn btn-ghost" onClick={() => setPayModal(null)}>Cancelar</button>
            <button className="btn btn-success" onClick={processPayment} disabled={paying}>
              {paying ? 'Procesando...' : (<><Check size={16} /> Confirmar Pago</>)}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
