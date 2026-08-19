import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Banknote,
  Package,
  Hourglass,
  TrendingUp,
  Target,
  Armchair,
  RefreshCw,
  ClipboardList,
  Sandwich,
  Users,
  BarChart3,
  Trophy,
  Zap,
  TrendingDown,
  Medal,
  Satellite,
} from 'lucide-react';
import { api } from '../services';
import { formatMoney } from '../services/format';
import EmptyState from '../components/EmptyState';

function CountUp({ value, isCurrency }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const startVal = prevRef.current;
    const duration = 900;
    const start = performance.now();
    let raf;

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;
      setDisplay(current);
      if (progress < 1) raf = requestAnimationFrame(step);
      else prevRef.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const text = isCurrency
    ? '$' + display.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.floor(display).toLocaleString('es-MX');
  return <span>{text}</span>;
}

function Sparkline({ data, color }) {
  const values = data || [];
  const max = Math.max(...values, 1);
  return (
    <div className="stat-sparkline">
      {values.map((v, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{ height: `${Math.max(3, (v / max) * 100)}%`, background: color }}
        />
      ))}
    </div>
  );
}

const ACTIVITY_COLORS = { paid: 'green', pending: 'amber', cancelled: 'red', ready: 'blue', preparing: 'blue', served: 'blue' };

export default function DashboardSection({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      api.getDashboardStats(),
      api.getRevenueChart(7),
      api.getTopItems(5),
      api.getOrders(),
    ]);
    if (results[0].status === 'fulfilled') setStats(results[0].value);
    if (results[1].status === 'fulfilled') setChart(results[1].value);
    if (results[2].status === 'fulfilled') setTopItems(results[2].value);
    if (results[3].status === 'fulfilled') setActivity(results[3].value.slice(0, 6));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const sparkData = chart.map((d) => parseFloat(d.revenue) || 0);
  const chartMax = Math.max(...sparkData, 1);

  const cards = [
    { key: 'today_revenue', label: 'Ingresos Hoy', trend: '— vs ayer', icon: <Banknote size={20} />, iconStyle: { background: 'var(--success-soft)', color: 'var(--success)' }, currency: true, color: 'var(--gradient-success)' },
    { key: 'today_orders', label: 'Órdenes Hoy', trend: '— hoy', icon: <Package size={20} />, iconStyle: { background: 'var(--info-soft)', color: 'var(--info)' }, currency: false, color: 'var(--gradient-info)' },
    { key: 'active_orders', label: 'Órdenes Activas', trend: 'en curso', icon: <Hourglass size={20} />, iconStyle: { background: 'var(--warning-soft)', color: 'var(--warning)' }, currency: false, color: 'var(--gradient-warning)' },
    { key: 'month_revenue', label: 'Ingresos del Mes', trend: 'este mes', icon: <TrendingUp size={20} />, iconStyle: { background: 'var(--primary-soft)', color: 'var(--primary)' }, currency: true, color: 'var(--gradient-primary)' },
    { key: 'avg_order', label: 'Ticket Promedio', trend: 'promedio', icon: <Target size={20} />, iconStyle: { background: 'var(--danger-soft)', color: 'var(--danger)' }, currency: true, color: 'var(--gradient-danger)' },
    { key: 'tables_served', label: 'Mesas Atendidas', trend: 'hoy', icon: <Armchair size={20} />, iconStyle: { background: 'rgba(168,85,247,0.12)', color: '#a855f7' }, currency: false, color: '#a855f7' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="subtitle">Resumen general del restaurante</p>
        </div>
        <button className={`btn btn-ghost btn-sm btn-refresh ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} disabled={refreshing}>
          <span className="refresh-icon"><RefreshCw size={16} /></span>
          Actualizar
        </button>
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => onNavigate('orders')}>
          <span className="qa-icon"><ClipboardList size={16} /></span> Ver Órdenes
        </button>
        <button className="quick-action-btn" onClick={() => onNavigate('menu')}>
          <span className="qa-icon"><Sandwich size={16} /></span> Gestionar Menú
        </button>
        <button className="quick-action-btn" onClick={() => onNavigate('revenue')}>
          <span className="qa-icon"><TrendingUp size={16} /></span> Ver Reportes
        </button>
        <button className="quick-action-btn" onClick={() => onNavigate('users')}>
          <span className="qa-icon"><Users size={16} /></span> Nuevo Usuario
        </button>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.key}>
            <div className="stat-card-top">
              <div className="stat-icon" style={c.iconStyle}>{c.icon}</div>
              <span className="stat-trend flat">{c.trend}</span>
            </div>
            <div className="stat-value">
              <CountUp value={stats ? stats[c.key] : 0} isCurrency={c.currency} />
            </div>
            <div className="stat-label">{c.label}</div>
            <Sparkline data={sparkData} color={c.color} />
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="h-icon"><BarChart3 size={18} /> Ingresos Últimos 7 Días</h3>
          </div>
          <div className="card-body">
            {chart.length > 0 && chart.some((d) => parseFloat(d.revenue) > 0) ? (
              <>
                <div className="chart-container">
                  <div className="chart-bar-group">
                    {chart.map((d, i) => {
                      const h = Math.max(4, (parseFloat(d.revenue) / chartMax) * 180);
                      return (
                        <div
                          key={i}
                          className="chart-bar"
                          style={{ height: `${h}px` }}
                          data-value={formatMoney(d.revenue)}
                          title={`${d.date} · ${formatMoney(d.revenue)}`}
                        />
                      );
                    })}
                  </div>
                  <div className="chart-labels">
                    {chart.map((d, i) => {
                      const date = new Date(d.date);
                      return (
                        <span key={i}>
                          {date.toLocaleDateString('es-MX', { weekday: 'short' })}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState icon={<TrendingDown size={22} />} title="Sin datos esta semana" description="Las ventas registradas aparecerán aquí como barras de ingresos diarios." />
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="h-icon"><Trophy size={18} /> Más Vendidos</h3>
          </div>
          <div className="card-body" style={{ paddingTop: '0.75rem' }}>
            {topItems.length === 0 ? (
              <EmptyState icon={<Medal size={22} />} title="Aún no hay ranking" description="Tus platillos más vendidos aparecerán aquí cuando se registren órdenes." />
            ) : (
              topItems.map((item, idx) => (
                <div key={idx} className="top-item">
                  <div className="top-item-rank">{idx + 1}</div>
                  <div className="top-item-name">{item.name}</div>
                  <div className="top-item-bar-wrap">
                    <div className="top-item-bar" style={{ width: `${Math.max(10, (item.total_sold / Math.max(...topItems.map((t) => t.total_sold), 1)) * 100)}%` }} />
                  </div>
                  <div className="top-item-count">{item.total_sold} vendidos</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="h-icon"><Zap size={18} /> Actividad Reciente</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {refreshing ? 'Actualizando...' : 'Actualizado hace un momento'}
          </span>
        </div>
        <div className="card-body" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          {activity.length === 0 ? (
            <EmptyState icon={<Satellite size={22} />} title="Sin actividad reciente" description="Aquí verás las últimas órdenes, pagos y cambios de estado en tiempo real." />
          ) : (
            activity.map((o) => (
              <div className="activity-item" key={o.id}>
                <div className={`activity-dot ${ACTIVITY_COLORS[o.status] || 'blue'}`} />
                <div className="activity-text">
                  Orden <strong>#{o.id}</strong> · Mesa {o.table_number} · {o.server_name || '—'} · {o.status}
                </div>
                <div className="activity-time">{formatTime(o.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}
