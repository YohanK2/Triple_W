import { useEffect, useMemo, useState } from 'react';
import { BarChart3, PieChart, ClipboardList, DollarSign } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useOrders, ORDER_STATES, orderTotal } from '../../context/ordersCore';
import { dashboardService } from '../../services/dashboardService';
import { formatMoney } from '../../services/format';
import '../../styles/Orders.css';

const STATE_COLORS = {
  pendiente: '#d6a225',
  preparacion: '#c99009',
  lista: '#78a95a',
  entregada: '#a08b5f',
  pagada: '#5a8a3c',
  cancelada: '#b9573d',
};

export default function Reports() {
  const { orders } = useOrders();
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    dashboardService.getResumen().then(setResumen).catch(() => setResumen(null));
  }, []);

  const porEstado = useMemo(() => {
    const counts = {};
    Object.keys(ORDER_STATES).forEach((k) => { counts[k] = 0; });
    orders.forEach((o) => { counts[o.estado] = (counts[o.estado] || 0) + 1; });
    return counts;
  }, [orders]);

  const maxEstado = Math.max(1, ...Object.values(porEstado));

  const topItems = useMemo(() => {
    const totals = new Map();
    orders.forEach((o) => o.items.forEach((i) => {
      const prev = totals.get(i.nombre) || { count: 0, revenue: 0 };
      totals.set(i.nombre, { count: prev.count + i.cantidad, revenue: prev.revenue + i.cantidad * i.precio });
    }));
    return [...totals.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 6);
  }, [orders]);

  const maxTop = Math.max(1, ...topItems.map(([, v]) => v.count));
  const recaudo = orders.filter((o) => o.estado === 'pagada').reduce((s, o) => s + orderTotal(o), 0);

  return <>
    <PageIntro
      eyebrow="Analítica"
      title="Reportes"
      description="Visualiza ventas, órdenes y comportamiento del negocio con datos reales."
    />

    <div className="stats-grid">
      <StatCard icon={DollarSign} label="Ventas hoy" value={resumen ? formatMoney(resumen.ventas_hoy) : '—'} />
      <StatCard icon={BarChart3} label="Ventas del mes" value={resumen ? formatMoney(resumen.ventas_mes) : '—'} />
      <StatCard icon={ClipboardList} label="Órdenes totales" value={orders.length} />
      <StatCard icon={PieChart} label="Recaudo pagado" value={formatMoney(recaudo)} />
    </div>

    <div className="content-grid two">
      <section className="panel">
        <div className="panel-head"><div><span className="panel-kicker">Operación</span><h3>Órdenes por estado</h3></div><BarChart3 size={20} /></div>
        {orders.length === 0 ? (
          <EmptyPanel title="Sin órdenes para graficar" text="Aparecerán al registrar comandas." />
        ) : (
          <div className="ord-activity">
            {Object.entries(porEstado).map(([estado, count]) => (
              <div key={estado} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 110, fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{ORDER_STATES[estado].label}</span>
                <div style={{ flex: 1, height: 14, background: '#f5efe3', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(count / maxEstado) * 100}%`,
                    minWidth: count > 0 ? '8px' : 0,
                    height: '100%',
                    background: STATE_COLORS[estado],
                    borderRadius: 99,
                    transition: 'width .4s ease',
                  }} />
                </div>
                <strong style={{ width: 26, textAlign: 'right', color: 'var(--brown)', fontSize: 12 }}>{count}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head"><div><span className="panel-kicker">Ranking</span><h3>Productos más vendidos</h3></div><PieChart size={20} /></div>
        {topItems.length === 0 ? (
          <EmptyPanel title="Sin ventas registradas" text="El ranking se calculará con los items de las órdenes." />
        ) : (
          <div className="ord-activity">
            {topItems.map(([nombre, v], idx) => (
              <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="ord-id" style={{ fontSize: 12, width: 22 }}>{idx + 1}.</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--brown)', fontWeight: 600 }}>{nombre}</span>
                <div style={{ width: 90, height: 10, background: '#f5efe3', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${(v.count / maxTop) * 100}%`, height: '100%', background: 'linear-gradient(90deg,var(--gold),var(--gold2))', borderRadius: 99 }} />
                </div>
                <strong style={{ width: 70, textAlign: 'right', color: 'var(--brown)', fontSize: 11 }}>{v.count} u · {formatMoney(v.revenue)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  </>;
}
