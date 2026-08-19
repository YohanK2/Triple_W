import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Timer,
  MessageSquare,
  ClipboardList,
  Flame,
  Check,
  RefreshCw,
  LogOut,
  Sparkles,
  CircleDot,
} from 'lucide-react';
import { api } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatDateTime, getElapsedMinutes } from '../services/format';
import EmptyState from '../components/EmptyState';

import '../assets/styles/cocina.css';

const POLL_MS = 5000;

function QueueCard({ order, nextStatus, buttonText, btnClass, onAction }) {
  const elapsed = getElapsedMinutes(order.created_at);
  const timeClass = elapsed > 20 ? 'critical' : elapsed > 10 ? 'warn' : 'ok';
  const isUrgent = elapsed > 15;

  return (
    <div className={`order-card ${isUrgent ? 'urgent' : ''}`}>
      <div className="order-card-header">
        <div>
          <span className="order-number">Orden #{order.id}</span>
          <span className="table-badge">Mesa {order.table_number}</span>
        </div>
        <span className={`time-elapsed ${timeClass}`}><Timer size={15} /> {elapsed} min</span>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Mesero: {order.server_name}
      </div>

      <div className="item-list">
        {order.items.map((item) => (
          <div className="item-row" key={item.id}>
            <span className="item-qty">{item.quantity}x</span>
            <span className="item-name">{item.item_name}</span>
            {item.special_instructions ? <span className="item-note text-icon"><MessageSquare size={12} /> {item.special_instructions}</span> : null}
          </div>
        ))}
      </div>

      {order.notes ? (
        <div className="text-icon" style={{ background: 'var(--warning-soft)', padding: '0.5rem 0.8rem', borderRadius: 8, margin: '0.5rem 0', fontSize: '0.82rem', color: 'var(--warning)' }}>
          <ClipboardList size={14} /> {order.notes}
        </div>
      ) : null}

      <div className="order-footer">
        <span className="order-time">{formatDateTime(order.created_at)}</span>
        <button className={`btn ${btnClass} btn-sm`} onClick={() => onAction(order.id, nextStatus)}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default function Kitchen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);

  const loadQueue = useCallback(async () => {
    try {
      setQueue(await api.getKitchenQueue());
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadQueue();
    const timer = setInterval(loadQueue, POLL_MS);
    return () => clearInterval(timer);
  }, [loadQueue]);

  const pending = useMemo(() => (queue || []).filter((o) => o.status === 'pending'), [queue]);
  const preparing = useMemo(() => (queue || []).filter((o) => o.status === 'preparing'), [queue]);

  useEffect(() => {
    document.title =
      pending.length > 0
        ? `(${pending.length}) Nuevas Órdenes - Cocina`
        : 'Cocina - Restaurant Manager';
    return () => {
      document.title = 'Restaurant Manager';
    };
  }, [pending.length]);

  async function updateStatus(orderId, newStatus) {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      const msg = newStatus === 'preparing' ? 'Orden en preparación' : '¡Orden lista para servir!';
      showToast(msg, newStatus === 'preparing' ? 'warning' : 'success', `Orden #${orderId}`);
      loadQueue();
    } catch (err) {
      showToast(err.message || 'Error al actualizar estado', 'urgent');
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div>
      <header className="kitchen-header">
        <div className="logo-area">
          <div className="icon"><ChefHat size={24} color="#fff" /></div>
          <h1>
            Pantalla de Cocina
            <small>Hola, {user?.name}</small>
          </h1>
        </div>
        <div className="kitchen-stats">
          <div className="kitchen-stat">
            <div className="value" style={{ color: 'var(--warning)' }}>{pending.length}</div>
            <div className="label">Pendientes</div>
          </div>
          <div className="kitchen-stat">
            <div className="value" style={{ color: 'var(--info)' }}>{preparing.length}</div>
            <div className="label">Preparando</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={loadQueue}><RefreshCw size={16} /> Actualizar</button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}><LogOut size={16} /> Salir</button>
          </div>
        </div>
      </header>

      <div className="kitchen-body">
        <div className="queue-section">
          <h2>
            <CircleDot size={16} color="var(--danger)" /> Nuevas Órdenes{' '}
            <span className={`badge badge-pending ${pending.length > 0 ? 'pulse' : ''}`}>{pending.length}</span>
          </h2>
          {pending.length === 0 ? (
            <EmptyState icon={<Sparkles size={22} />} title="No hay órdenes nuevas" />
          ) : (
            <div className="order-queue">
              {pending.map((o) => (
                <QueueCard
                  key={o.id}
                  order={o}
                  nextStatus="preparing"
                  buttonText={<><Flame size={16} /> Empezar a Preparar</>}
                  btnClass="btn-warning"
                  onAction={updateStatus}
                />
              ))}
            </div>
          )}
        </div>

        <div className="queue-section">
          <h2>
            <CircleDot size={16} color="var(--warning)" /> En Preparación{' '}
            <span className="badge badge-preparing">{preparing.length}</span>
          </h2>
          {preparing.length === 0 ? (
            <EmptyState icon={<ChefHat size={22} />} title="Nada en preparación" />
          ) : (
            <div className="order-queue">
              {preparing.map((o) => (
                <QueueCard
                  key={o.id}
                  order={o}
                  nextStatus="ready"
                  buttonText={<><Check size={16} /> Marcar Lista</>}
                  btnClass="btn-success"
                  onAction={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
