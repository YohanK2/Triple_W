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
import { ordenesService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatDateTime, getElapsedMinutes } from '../services/format';
import EmptyState from '../components/EmptyState';

import '../assets/styles/cocina.css';

const POLL_MS = 5000;

function QueueCard({ order, nextStatus, buttonText, btnClass, onAction, now }) {
  const elapsed = getElapsedMinutes(order.creado_en, now);
  const timeClass = elapsed > 20 ? 'critical' : elapsed > 10 ? 'warn' : 'ok';
  const isUrgent = elapsed > 20;

  return (
    <div
      className={`order-card ${isUrgent ? 'urgent' : ''}`}
      style={{ minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div className="order-card-header">
        <div>
          <span className="order-number">Orden #{order.id_orden}</span>
          <span className="table-badge">Mesa #{order.id_mesa || 'Barra'}</span>
        </div>
        <span className={`time-elapsed ${timeClass}`}><Timer size={15} /> {elapsed} min</span>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Mesero: {order.mesero_name}
      </div>

      <div className="item-list">
        {(!order.items || order.items.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
            Sin detalle de platillos registrado
          </p>
        ) : order.items.map((item, index) => (
          <div className="item-row" key={item.id_item_orden || index}>
            <span className="item-qty">{item.cantidad ?? item.quantity}x</span>
            <span className="item-name">{item.nombre || item.item_name}</span>
            {item.instrucciones_especiales || item.special_instructions ? (
              <span className="item-note text-icon">
                <MessageSquare size={12} /> {item.instrucciones_especiales || item.special_instructions}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {order.notas ? (
        <div className="text-icon" style={{ background: 'var(--warning-soft)', padding: '0.5rem 0.8rem', borderRadius: 8, margin: '0.5rem 0', fontSize: '0.82rem', color: 'var(--warning)' }}>
          <ClipboardList size={14} /> {order.notas}
        </div>
      ) : null}

      <div className="order-footer">
        <span className="order-time">{formatDateTime(order.creado_en)}</span>
        <button
          className={`btn ${btnClass} btn-sm`}
          style={{ minHeight: 44, paddingInline: '1rem' }}
          onClick={() => onAction(order, nextStatus)}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default function Cocinero() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  const loadQueue = useCallback(async () => {
    try {
      const data = await ordenesService.getKitchenQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error al cargar cola de cocina:', e);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadQueue, 0);
    const timer = setInterval(loadQueue, POLL_MS);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(timer);
    };
  }, [loadQueue]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pending = useMemo(() => (queue || []).filter((o) => o.estado === 'pendiente'), [queue]);
  const preparing = useMemo(
    () => (queue || []).filter((o) => o.estado === 'preparando' || o.estado === 'en_preparacion'),
    [queue]
  );

  useEffect(() => {
    document.title =
      pending.length > 0
         ? `(${pending.length}) Nuevas Comandas - Cocina`
        : 'Cocina - Restaurant Manager';
    return () => {
      document.title = 'Restaurant Manager';
    };
  }, [pending.length]);

  async function updateStatus(order, newStatus) {
    try {
      await ordenesService.updateOrden(order.id_orden, { ...order, estado: newStatus });

      // La auditoría usa IDs de estados, no sus nombres de texto.
      try {
        const estados = await ordenesService.getEstadosDisponibles();
        const normalizeStatus = (status) => {
          if (status === 'en_preparacion') return 'preparando';
          if (status === 'lista') return 'listo';
          return status;
        };
        const estadoAnterior = estados.find((estado) => estado.nombre_estado === normalizeStatus(order.estado));
        const estadoNuevo = estados.find((estado) => estado.nombre_estado === normalizeStatus(newStatus));

        if (estadoNuevo) {
          await ordenesService.registrarCambioEstado({
            id_orden: order.id_orden,
            id_estado_anterior: estadoAnterior?.id_estado || null,
            id_estado_nuevo: estadoNuevo.id_estado,
            cambiado_por: user?.id_usuario || 1,
          });
        }
      } catch (auditError) {
        console.warn('Auditoría no registrada:', auditError);
        showToast('Estado actualizado, pero no se pudo registrar la auditoría', 'urgent');
      }

      const msg = newStatus === 'preparando' ? 'Orden en preparación' : '¡Orden lista para servir!';
      showToast(msg, newStatus === 'preparando' ? 'warning' : 'success', `Orden #${order.id_orden}`);
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #f8fafc)' }}>
      <header className="Cocinero-header">
        <div className="logo-area">
          <div className="icon"><ChefHat size={24} color="#fff" /></div>
          <h1>
            Pantalla de Cocina
            <small>Hola, {user?.nombres || user?.nombre_usuario || ''}</small>
          </h1>
        </div>
        <div className="Cocinero-stats">
          <div className="Cocinero-stat">
            <div className="value" style={{ color: 'var(--warning)' }}>{pending.length}</div>
            <div className="label">Pendientes</div>
          </div>
          <div className="Cocinero-stat">
            <div className="value" style={{ color: 'var(--info)' }}>{preparing.length}</div>
            <div className="label">Preparando</div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={loadQueue}><RefreshCw size={16} /> Actualizar</button>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}><LogOut size={16} /> Salir</button>
          </div>
        </div>
      </header>

      <div className="Cocinero-body">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Sincronizando comandas de cocina con FastAPI...
          </p>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        <div className="queue-section">
          <h2>
            <CircleDot size={16} color="var(--danger)" /> Nuevas Comandas{' '}
            <span className={`badge badge-pending ${pending.length > 0 ? 'pulse' : ''}`}>{pending.length}</span>
          </h2>
          {pending.length === 0 ? (
            <EmptyState icon={<Sparkles size={22} />} title="No hay órdenes nuevas" />
          ) : (
            <div className="order-queue">
              {pending.map((o) => (
                <QueueCard
                  key={o.id_orden}
                  order={o}
                  nextStatus="preparando"
                  now={now}
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
                  key={o.id_orden}
                  order={o}
                  nextStatus="listo"
                  now={now}
                  buttonText={<><Check size={16} /> ¡Marcar Lista!</>}
                  btnClass="btn-success"
                  onAction={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
