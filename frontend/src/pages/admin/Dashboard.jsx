import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, ClipboardList, DollarSign, Package, PieChart, Store } from 'lucide-react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import PageIntro from '../../components/common/PageIntro.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useOrders, ORDER_STATES, orderTotal } from '../../context/ordersCore';
import { dashboardService } from '../../services/dashboardService';
import { formatMoney } from '../../services/format';
import '../../styles/app.css';
import '../../styles/Orders.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

/* Paleta Triple W por estado de orden (claves de UI) */
const ESTADO_COLORS = {
  pendiente: '#D4A017',
  preparacion: '#c9772e',
  lista: '#4d8a8a',
  entregada: '#8a7a5a',
  pagada: '#5a8a3c',
  cancelada: '#b9573d',
};

const PRESETS = [
  { label: 'Hoy', dias: 1 },
  { label: '7 días', dias: 7 },
  { label: '30 días', dias: 30 },
  { label: '90 días', dias: 90 },
];

const opcionesGrafica = {
  responsive: true,
  maintainAspectRatio: false,
};

const opcionesBar = {
  ...opcionesGrafica,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(59,42,22,.07)' } },
    x: { grid: { display: false } },
  },
};

const opcionesDona = {
  ...opcionesGrafica,
  cutout: '58%',
  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, font: { size: 10 } } } },
};

function isoFecha(d) {
  return d.toISOString().slice(0, 10);
}

function rangoPreset(dias) {
  return {
    desde: isoFecha(new Date(Date.now() - (dias - 1) * 86400000)),
    hasta: isoFecha(new Date()),
  };
}

export default function Dashboard() {
  const { orders, loading } = useOrders();
  const [resumen, setResumen] = useState(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  useEffect(() => {
    dashboardService.getResumen()
      .then(setResumen)
      .catch(() => setResumen(null));
  }, []);

  /* Rango por defecto: últimos 7 días */
  useEffect(() => {
    setDesde(isoFecha(new Date(Date.now() - 6 * 86400000)));
    setHasta(isoFecha(new Date()));
  }, []);

  const aplicarPreset = (dias) => {
    const rango = rangoPreset(dias);
    setDesde(rango.desde);
    setHasta(rango.hasta);
  };

  const activas = useMemo(
    () => orders.filter((o) => !['pagada', 'cancelada'].includes(o.estado)).length,
    [orders],
  );
  const recientes = orders.slice(0, 5);

  /* Órdenes dentro del rango seleccionado */
  const ordenesFiltradas = useMemo(() => {
    if (!desde || !hasta) return [];
    return orders.filter((o) => {
      const clave = String(o.creadoEn || '').slice(0, 10);
      return clave >= desde && clave <= hasta;
    });
  }, [orders, desde, hasta]);

  const rangoValido = Boolean(desde && hasta && desde <= hasta);

  /* Gráfica: órdenes por día (o por mes si el rango es largo) */
  const datosPorDia = useMemo(() => {
    if (!rangoValido) return null;
    const d0 = new Date(`${desde}T00:00:00`);
    const d1 = new Date(`${hasta}T00:00:00`);
    const totalDias = Math.round((d1 - d0) / 86400000) + 1;
    const mensual = totalDias > 45;

    const claves = [];
    if (mensual) {
      const cur = new Date(d0);
      let guardia = 0;
      while (cur <= d1 && guardia < 120) {
        claves.push({
          clave: isoFecha(cur).slice(0, 7),
          etiqueta: cur.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }),
        });
        cur.setMonth(cur.getMonth() + 1);
        guardia += 1;
      }
    } else {
      for (let i = 0; i < totalDias; i += 1) {
        const d = new Date(d0.getTime() + i * 86400000);
        claves.push({
          clave: isoFecha(d),
          etiqueta: d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit' }),
        });
      }
    }

    const conteo = Object.fromEntries(claves.map((c) => [c.clave, 0]));
    ordenesFiltradas.forEach((o) => {
      const clave = String(o.creadoEn || '').slice(0, mensual ? 7 : 10);
      if (clave in conteo) conteo[clave] += 1;
    });

    return {
      labels: claves.map((c) => c.etiqueta),
      datasets: [{
        label: 'Órdenes',
        data: claves.map((c) => conteo[c.clave]),
        backgroundColor: '#D4A017',
        hoverBackgroundColor: '#b9870f',
        borderRadius: 6,
        maxBarThickness: 26,
      }],
    };
  }, [ordenesFiltradas, rangoValido, desde, hasta]);

  /* Gráfica: órdenes por estado dentro del rango */
  const datosPorEstado = useMemo(() => {
    const conteo = {};
    ordenesFiltradas.forEach((o) => {
      conteo[o.estado] = (conteo[o.estado] || 0) + 1;
    });
    const entradas = Object.entries(conteo);
    return {
      labels: entradas.map(([ui]) => ORDER_STATES[ui]?.label ?? ui),
      datasets: [{
        data: entradas.map(([, n]) => n),
        backgroundColor: entradas.map(([ui]) => ESTADO_COLORS[ui] ?? '#E8D9B5'),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 6,
      }],
    };
  }, [ordenesFiltradas]);

  const presetActivo = useMemo(() => {
    if (!desde || !hasta) return 0;
    const diff = Math.round((new Date(`${hasta}T00:00:00`) - new Date(`${desde}T00:00:00`)) / 86400000) + 1;
    return PRESETS.find((p) => p.dias === diff)?.dias ?? 0;
  }, [desde, hasta]);

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

      <section className="panel">
        <div className="panel-head">
          <div><span className="panel-kicker">Analítica</span><h3>Órdenes por fecha</h3><p>{ordenesFiltradas.length} órdenes en el periodo seleccionado</p></div>
          <PieChart size={20} />
        </div>

        <div className="chart-filters">
          <div className="cash-state-tabs" style={{ marginBottom: 0 }}>
            {PRESETS.map(({ label, dias }) => (
              <button
                key={dias}
                type="button"
                className={presetActivo === dias ? 'active' : ''}
                onClick={() => aplicarPreset(dias)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="chart-date">Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label>
          <label className="chart-date">Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></label>
        </div>

        {!rangoValido ? (
          <p className="chart-fallback">Selecciona un rango de fechas válido.</p>
        ) : (
          <div className="charts-duo">
            <div>
              <span className="chart-caption">Órdenes por día</span>
              <div className="chart-box">
                {loading ? <p className="chart-fallback">Cargando gráfica...</p> : <Bar data={datosPorDia} options={opcionesBar} />}
              </div>
            </div>
            <div>
              <span className="chart-caption">Órdenes por estado</span>
              <div className="chart-box chart-box-donut">
                {ordenesFiltradas.length === 0 ? (
                  <p className="chart-fallback">Sin órdenes en este periodo.</p>
                ) : (
                  <Doughnut data={datosPorEstado} options={opcionesDona} />
                )}
              </div>
            </div>
          </div>
        )}
      </section>

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
    </>
  );
}
