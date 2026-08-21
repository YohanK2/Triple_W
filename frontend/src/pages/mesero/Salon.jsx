import { useCallback, useEffect, useMemo, useState } from 'react';
import { Armchair, MapPin, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageIntro from '../../components/common/PageIntro.jsx';
import TableActionsModal from '../../components/mesero/TableActionsModal.jsx';
import ReservationInfoModal from '../../components/mesero/ReservationInfoModal.jsx';
import { useToast } from '../../components/Toast';
import { mesasService } from '../../services/mesasService';
import { reservasService } from '../../services/reservasService';
import { clientesService } from '../../services/clientesService';
import '../../styles/Salon.css';

function fmtFechaHora(fechaReserva) {
  const d = new Date(String(fechaReserva).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(fechaReserva);
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Salon() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mesas, setMesas] = useState(null);
  const [estadosPorMesa, setEstadosPorMesa] = useState({});
  const [actionsTable, setActionsTable] = useState(null);
  const [infoReserva, setInfoReserva] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [ms, es] = await Promise.all([mesasService.getMesas(), mesasService.getEstados()]);
      /* Estado actual = registro más reciente por mesa */
      const latest = {};
      es.forEach((e) => {
        const prev = latest[e.id_mesa];
        if (!prev || e.id_estado > prev.id_estado) latest[e.id_mesa] = e;
      });
      setMesas(ms);
      setEstadosPorMesa(latest);
    } catch (e) {
      setMesas([]);
      showToast(e.message || 'Error cargando mesas', 'urgent');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const mesasView = useMemo(
    () => (mesas || []).map((m) => ({
      ...m,
      estado: estadosPorMesa[m.id_mesa]?.estado || 'libre',
    })).sort((a, b) => a.numero_mesa - b.numero_mesa),
    [mesas, estadosPorMesa],
  );

  const handleClick = async (t) => {
    if (t.estado === 'libre') {
      setActionsTable(t);
    } else if (t.estado === 'reservada') {
      try {
        const [reservas, clientes] = await Promise.all([reservasService.getReservas(), clientesService.getClientes()]);
        const cliMap = new Map(clientes.map((c) => [c.id_cliente, c.nombre]));
        const reserva = reservas
          .filter((r) => r.id_mesa === t.id_mesa && r.estado !== 'cancelada' && r.estado !== 'completada')
          .sort((a, b) => b.id_reserva - a.id_reserva)[0];
        if (!reserva) {
          showToast('No se encontró la reserva de esta mesa', 'warning');
          return;
        }
        setInfoReserva({
          numero: t.numero_mesa,
          clienteNombre: cliMap.get(reserva.id_cliente) || `Cliente #${reserva.id_cliente}`,
          personas: reserva.tamano_grupo ?? 0,
          fechaHora: fmtFechaHora(reserva.fecha_reserva),
        });
      } catch (err) {
        showToast(err.message || 'Error consultando la reserva', 'urgent');
      }
    }
    /* ocupada y mantenimiento: solo visual */
  };

  const goOrder = (t) => {
    navigate('/server/nueva-orden', { state: { mesaId: t.id, mesaNumero: t.numero_mesa } });
  };


  return <>
    <PageIntro
      eyebrow="Mesero"
      title="Salón y mesas"
      description="Mapa del salón con el estado real de cada mesa."
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost-btn" onClick={load} disabled={refreshing}>
            <RefreshCw size={17} className={refreshing ? 'spin' : ''} /> Actualizar
          </button>
        </div>
      }
    />
    <div className="table-legend">
      <span><i className="status-dot ok"/> Libre</span>
      <span><i className="status-dot danger"/> Ocupada</span>
      <span><i className="status-dot warn"/> Reservada</span>
      <span><i className="status-dot neutral"/> Mantenimiento</span>
    </div>
    <section className="tables-grid">
      {mesas === null ? (
        <div className="empty-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="empty-icon"><Armchair size={22} /></div>
          <h3>Cargando mesas...</h3>
          <p>Consultando /mesas_restaurante y /estado_mesas.</p>
        </div>
      ) : mesasView.length === 0 ? (
        <div className="empty-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="empty-icon"><Armchair size={22} /></div>
          <h3>Sin mesas registradas</h3>
          <p>Registra mesas en el sistema para ver el mapa del salón.</p>
        </div>
      ) : mesasView.map((t) => (
        <button
          className={`restaurant-table ${t.estado}`} key={t.id_mesa} type="button"
          onClick={() => handleClick(t)}
        >
          <div className="table-shape">
            <Armchair size={22}/>
            <strong>{String(t.numero_mesa).padStart(2, '0')}</strong>
          </div>
          <span>Mesa {t.numero_mesa}</span>
          <small>
            <i className={`status-dot ${t.estado === 'libre' ? 'ok' : t.estado === 'ocupada' ? 'danger' : t.estado === 'reservada' ? 'warn' : 'neutral'}`}/>
            {t.estado === 'libre' ? 'Libre' : t.estado === 'ocupada' ? 'Ocupada' : t.estado === 'reservada' ? 'Reservada' : 'Mantenimiento'}
            {t.capacidad ? <><Users size={12}/> {t.capacidad}</> : null}
          </small>
        </button>
      ))}
    </section>
    <div className="visual-note">
      <MapPin size={17}/> Estados sincronizados con la base de datos. Al crear una orden o reserva, la mesa cambia de estado automáticamente.
    </div>

    <TableActionsModal
      table={actionsTable}
      onClose={() => setActionsTable(null)}
      onOrder={goOrder}
      onReserved={(msg) => { showToast(msg, 'success'); load(); }}
    />
    <ReservationInfoModal reserva={infoReserva} onClose={() => setInfoReserva(null)} />
  </>;
}
