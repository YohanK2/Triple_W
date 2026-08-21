import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ClipboardList, DollarSign, Package, Store, UtensilsCrossed } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useOrders, ORDER_STATES, orderTotal } from '../../context/ordersCore';
import { dashboardService } from '../../services/dashboardService';
import { formatMoney } from '../../services/format';
import '../../styles/app.css';
import '../../styles/Orders.css';

export default function Dashboard() {
  const { orders, loading } = useOrders();
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    dashboardService.getResumen()
      .then(setResumen)
      .catch(() => setResumen(null));
  }, []);

  const activas = useMemo(
    () => orders.filter((o) => !['pagada', 'cancelada'].includes(o.estado)).length,
    [orders],
  );
  const recientes = orders.slice(0, 5);

  return (
    <>
      <PageIntro
        eyebrow="Resumen"
        title="Panel principal"
        description="Indicadores en vivo del restaurante conectados a la base de datos."
      />
      <div className="stats-grid">
        <StatCard icon={DollarSign} label="Ventas hoy" value={resumen ? formatMoney(resumen.ventas_hoy) : '—'} hint="Registradas en caja" />
        <StatCard icon={BarChart3} label="Ventas del mes" value={resumen ? formatMoney(resumen.ventas_mes) : '—'} />
        <StatCard icon={ClipboardList} label="Órdenes activas" value={loading ? '…' : activas} hint={`${resumen?.ordenes_totales ?? '—'} totales`} />
        <StatCard icon={Store} label="Mesas activas" value={resumen ? `${resumen.mesas_activas}/${resumen.total_mesas}` : '—'} hint={`${resumen?.reservas_hoy ?? 0} reservas hoy`} />
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-head"><div><span className="panel-kicker">Analítica</span><h3>Resumen operativo</h3></div><Activity size={20} /></div>
          <div className="ord-activity">
            <div className="ord-activity-row"><strong>Productos</strong><span>{resumen ? `${resumen.productos_disponibles} disponibles / ${resumen.total_productos}` : '—'}</span><span className="ord-total-inline">{resumen ? `${resumen.total_clientes} clientes` : ''}</span></div>
            <div className="ord-activity-row"><strong>Insumos bajos</strong><span>{resumen ? `${resumen.ingredientes_bajo_stock} ingredientes bajo mínimo` : '—'}</span><span className="ord-total-inline">{resumen ? `${resumen.proveedores_activos} proveedores` : ''}</span></div>
            <div className="ord-activity-row"><strong>Usuarios</strong><span>{resumen ? `${resumen.usuarios_activos} activos / ${resumen.total_usuarios}` : '—'}</span><span className="ord-total-inline">{resumen ? formatMoney(resumen.facturas_mes) + ' facturas mes' : ''}</span></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><div><span className="panel-kicker">Operación</span><h3>Órdenes recientes</h3></div><Package size={20} /></div>
          {recientes.length === 0 ? (
            <div className="empty-panel" style={{ minHeight: 210 }}>
              <div className="empty-icon"><ClipboardList size={22} /></div>
              <h3>{loading ? 'Cargando órdenes...' : 'Sin órdenes todavía'}</h3>
              <p>Cuando los meseros creen comandas se verán aquí con su estado en vivo.</p>
            </div>
          ) : (
            <div className="ord-activity">
              {recientes.map((o) => (
                <div className="ord-activity-row" key={o.id}>
                  <strong>#{o.id}</strong>
                  <span>Mesa {o.mesa}</span>
                  <span className={`ord-status sm ${o.estado}`}>{ORDER_STATES[o.estado].label}</span>
                  <span className="ord-total-inline">{formatMoney(orderTotal(o))}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      <div className="visual-note" style={{ marginTop: 16 }}>
        <UtensilsCrossed size={17} /> Datos en vivo desde /dashboard/resumen y /ordenes.
      </div>
    </>
  );
}
