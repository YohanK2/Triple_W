import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Banknote,
  Package,
  Hourglass,
  TrendingUp,
  AlertTriangle,
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
  CalendarCheck,
} from 'lucide-react';
import { dashboardService, ordenesService, facturasService, menuService } from '../services';
import { useAuth } from '../context/AuthContext';
import { formatMoney } from '../services/format';
import EmptyState from '../components/EmptyState';

// Componente animador de números blindado
function CountUp({ value = 0, isCurrency = false }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const startVal = prevRef.current;
    const duration = 800;
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

// Sparkline decorativo blindado
function Sparkline({ data = [], color = 'var(--primary)' }) {
  const values = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0, 0];
  const max = Math.max(...values, 1);

  return (
    <div className="stat-sparkline">
      {values.map((v, i) => (
        <div
          key={i}
          className="spark-bar"
          style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color }}
        />
      ))}
    </div>
  );
}

const ACTIVITY_COLORS = {
  pagada: 'green',
  servida: 'green',
  pendiente: 'amber',
  en_preparacion: 'blue',
  lista: 'blue',
  cancelada: 'red',
};

export default function DashboardSection({ onNavigate }) {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [ordenes, setOrdenes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Carga de datos con Promise.allSettled para tolerancia a fallos
  const loadData = useCallback(async () => {
    try {
      const [resumenRes, ordenesRes, facturasRes, menuRes] = await Promise.allSettled([
        dashboardService.getResumen(),
        ordenesService.getOrdenes(),
        facturasService.getFacturas(),
        menuService.getItems(),
      ]);

      if (resumenRes.status === 'fulfilled' && resumenRes.value) {
        setResumen(resumenRes.value);
      } else {
        setResumen(null);
      }

      if (ordenesRes.status === 'fulfilled' && Array.isArray(ordenesRes.value)) {
        setOrdenes(ordenesRes.value);
      } else {
        setOrdenes([]);
      }

      if (facturasRes.status === 'fulfilled' && Array.isArray(facturasRes.value)) {
        setFacturas(facturasRes.value);
      } else {
        setFacturas([]);
      }

      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value)) {
        setMenuItems(menuRes.value);
      } else {
        setMenuItems([]);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // Generar ingresos de los últimos 7 días a partir de las facturas
  const chartData = useMemo(() => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];

      // Sumar facturas de ese día
      const dayTotal = (facturas || [])
        .filter((f) => f.fecha_emision && f.fecha_emision.startsWith(dateKey))
        .reduce((sum, f) => sum + (Number(f.total) || 0), 0);

      days.push({
        date: dateKey,
        dayName: d.toLocaleDateString('es-MX', { weekday: 'short' }),
        revenue: dayTotal,
      });
    }
    return days;
  }, [facturas]);

  const sparkData = chartData.map((d) => d.revenue);
  const chartMax = Math.max(...sparkData, 1);

  // Órdenes activas (pendientes o en preparación)
  const ordenesActivas = useMemo(() => {
    const porEstado = resumen?.ordenes_por_estado || {};
    return (porEstado['pendiente'] || 0) + (porEstado['en_preparacion'] || 0);
  }, [resumen]);

  // Actividad reciente (últimas 6 órdenes)
  const actividadReciente = useMemo(() => {
    return [...(ordenes || [])]
      .sort((a, b) => (b.id_orden || 0) - (a.id_orden || 0))
      .slice(0, 6);
  }, [ordenes]);

  // Tarjetas principales del Dashboard
  const cards = [
    {
      key: 'ventas_hoy',
      value: Number(resumen?.ventas_hoy) || 0,
      label: 'Ventas de Hoy',
      trend: 'registrado hoy',
      icon: <Banknote size={20} />,
      iconStyle: { background: 'var(--success-soft)', color: 'var(--success)' },
      currency: true,
      color: 'var(--gradient-success)',
    },
    {
      key: 'ventas_mes',
      value: Number(resumen?.ventas_mes) || 0,
      label: 'Ventas del Mes',
      trend: `${resumen?.facturas_mes || 0} facturas`,
      icon: <TrendingUp size={20} />,
      iconStyle: { background: 'var(--primary-soft)', color: 'var(--primary)' },
      currency: true,
      color: 'var(--gradient-primary)',
    },
    {
      key: 'ordenes_activas',
      value: ordenesActivas,
      label: 'Órdenes en Cocina',
      trend: `${resumen?.ordenes_totales || 0} totales`,
      icon: <Hourglass size={20} />,
      iconStyle: { background: 'var(--warning-soft)', color: 'var(--warning)' },
      currency: false,
      color: 'var(--gradient-warning)',
    },
    {
      key: 'mesas_activas',
      value: resumen?.mesas_activas || 0,
      label: 'Mesas Disponibles',
      trend: `${resumen?.total_mesas || 0} en total`,
      icon: <Armchair size={20} />,
      iconStyle: { background: 'rgba(168,85,247,0.12)', color: '#a855f7' },
      currency: false,
      color: '#a855f7',
    },
    {
      key: 'ingredientes_bajo_stock',
      value: resumen?.ingredientes_bajo_stock || 0,
      label: 'Stock Mínimo',
      trend: resumen?.ingredientes_bajo_stock > 0 ? 'requiere compra' : 'stock óptimo',
      icon: <AlertTriangle size={20} />,
      iconStyle: { background: 'var(--danger-soft)', color: 'var(--danger)' },
      currency: false,
      color: 'var(--gradient-danger)',
    },
    {
      key: 'reservas_hoy',
      value: resumen?.reservas_hoy || 0,
      label: 'Reservas de Hoy',
      trend: `${resumen?.total_clientes || 0} clientes`,
      icon: <CalendarCheck size={20} />,
      iconStyle: { background: 'var(--info-soft)', color: 'var(--info)' },
      currency: false,
      color: 'var(--gradient-info)',
    },
  ];

  const handleNavigate = (view) => {
    if (typeof onNavigate === 'function') {
      onNavigate(view);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1>Dashboard Principal</h1>
          <p className="subtitle">
            Hola, <strong>{user?.nombres || user?.nombre_usuario || 'Administrador'}</strong> · Estado general del restaurante
          </p>
        </div>
        <button
          className={`btn btn-ghost btn-sm btn-refresh ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <span className="refresh-icon">
            <RefreshCw size={16} />
          </span>
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Accesos Rápidos */}
      <div className="quick-actions">
        <button className="quick-action-btn" onClick={() => handleNavigate('orders')}>
          <span className="qa-icon"><ClipboardList size={16} /></span> Ver Comandas
        </button>
        <button className="quick-action-btn" onClick={() => handleNavigate('menu')}>
          <span className="qa-icon"><Sandwich size={16} /></span> Menú ({menuItems.length} platillos)
        </button>
        <button className="quick-action-btn" onClick={() => handleNavigate('revenue')}>
          <span className="qa-icon"><TrendingUp size={16} /></span> Facturación
        </button>
        <button className="quick-action-btn" onClick={() => handleNavigate('users')}>
          <span className="qa-icon"><Users size={16} /></span> Usuarios ({resumen?.total_usuarios || 0})
        </button>
      </div>

      {/* Tarjetas de Métricas (KPIs) */}
      <div className="stats-grid">
        {cards.map((c) => (
          <div className="stat-card" key={c.key}>
            <div className="stat-card-top">
              <div className="stat-icon" style={c.iconStyle}>
                {c.icon}
              </div>
              <span className="stat-trend flat">{c.trend}</span>
            </div>
            <div className="stat-value">
              <CountUp value={c.value} isCurrency={c.currency} />
            </div>
            <div className="stat-label">{c.label}</div>
            <Sparkline data={sparkData} color={c.color} />
          </div>
        ))}
      </div>

      {/* Gráfico y Platillos */}
      <div className="grid-2" style={{ marginBottom: '1.5rem', gap: '1.5rem' }}>
        {/* Gráfica de 7 Días */}
        <div className="card">
          <div className="card-header">
            <h3 className="h-icon">
              <BarChart3 size={18} /> Ingresos de los Últimos 7 Días
            </h3>
          </div>
          <div className="card-body">
            {chartData.some((d) => d.revenue > 0) ? (
              <div className="chart-container">
                <div className="chart-bar-group" style={{ display: 'flex', alignItems: 'flex-end', height: '180px', gap: '0.75rem', paddingBottom: '0.5rem' }}>
                  {chartData.map((d, i) => {
                    const h = Math.max(8, (d.revenue / chartMax) * 160);
                    return (
                      <div
                        key={i}
                        className="chart-bar"
                        style={{
                          height: `${h}px`,
                          flex: 1,
                          background: 'var(--primary)',
                          borderRadius: '4px',
                          transition: 'height 0.4s ease',
                        }}
                        title={`${d.date}: ${formatMoney(d.revenue)}`}
                      />
                    );
                  })}
                </div>
                <div className="chart-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {chartData.map((d, i) => (
                    <span key={i} style={{ flex: 1, textAlign: 'center' }}>
                      {d.dayName}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<TrendingDown size={22} />}
                title="Sin facturación esta semana"
                description="Las facturas emitidas aparecerán aquí reflejadas por día."
              />
            )}
          </div>
        </div>

        {/* Resumen del Menú / Catálogo */}
        <div className="card">
          <div className="card-header">
            <h3 className="h-icon">
              <Trophy size={18} /> Platillos del Menú
            </h3>
          </div>
          <div className="card-body" style={{ paddingTop: '0.75rem' }}>
            {menuItems.length === 0 ? (
              <EmptyState
                icon={<Medal size={22} />}
                title="No hay platillos registrados"
                description="Agrega nuevos platillos desde la sección de Menú."
              />
            ) : (
              menuItems.slice(0, 5).map((item) => (
                <div
                  key={item.id_item_menu}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: item.disponible ? 'var(--success)' : 'var(--danger)' }}>
                      {item.disponible ? 'Disponible' : 'Agotado'}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatMoney(item.precio)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Actividad Reciente de Comandas */}
      <div className="card">
        <div className="card-header">
          <h3 className="h-icon">
            <Zap size={18} /> Actividad Reciente de Comandas
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {refreshing ? 'Sincronizando...' : 'Conectado a FastAPI'}
          </span>
        </div>
        <div className="card-body" style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
          {actividadReciente.length === 0 ? (
            <EmptyState
              icon={<Satellite size={22} />}
              title="Sin comandas registradas"
              description="Aquí verás las órdenes enviadas por los meseros en tiempo real."
            />
          ) : (
            actividadReciente.map((o) => (
              <div
                className="activity-item"
                key={o.id_orden}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  className={`activity-dot ${ACTIVITY_COLORS[o.estado] || 'blue'}`}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: ACTIVITY_COLORS[o.estado] === 'green' ? 'var(--success)' : ACTIVITY_COLORS[o.estado] === 'amber' ? 'var(--warning)' : 'var(--primary)',
                  }}
                />
                <div className="activity-text" style={{ flex: 1, fontSize: '0.85rem' }}>
                  Comanda <strong>#{o.id_orden}</strong> · Mesa <strong>#{o.id_mesa || 'Barra'}</strong> · Estado:{' '}
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{o.estado || 'pendiente'}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{formatMoney(o.total)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}