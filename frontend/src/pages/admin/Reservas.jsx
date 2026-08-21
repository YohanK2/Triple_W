import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock, Users, Store, X, Hourglass, CheckCheck, LayoutList, RefreshCw,
} from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';
import { reservasService } from '../../services/reservasService';
import { clientesService } from '../../services/clientesService';
import { mesasService } from '../../services/mesasService';
import '../../styles/Reservas.css';

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

function partesFecha(fechaReserva) {
  const d = new Date(String(fechaReserva).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  return {
    hora: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    dia: String(d.getDate()).padStart(2, '0'),
    mes: d.toLocaleString('es-CO', { month: 'short' }).replace('.', ''),
    completa: d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
  };
}

const ESTADO_LABELS = { pendiente: 'Pendiente', confirmada: 'Confirmada' };

export default function Reservas() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [reservas, setReservas] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [rs, cs, ms] = await Promise.all([
        reservasService.getReservas(),
        clientesService.getClientes(),
        mesasService.getMesas(),
      ]);
      setReservas(rs);
      setClientes(cs);
      setMesas(ms);
    } catch (e) {
      setReservas([]);
      showToast(e.message || 'Error cargando reservas', 'urgent');
    } finally {
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const cliMap = useMemo(() => new Map(clientes.map((c) => [c.id_cliente, c.nombre])), [clientes]);
  const mesaMap = useMemo(() => new Map(mesas.map((m) => [m.id_mesa, m.numero_mesa])), [mesas]);

  /* Solo reservaciones activas: pendientes y confirmadas, las próximas primero */
  const activas = useMemo(
    () => (reservas || [])
      .filter((r) => r.estado === 'pendiente' || r.estado === 'confirmada')
      .sort((a, b) => new Date(String(a.fecha_reserva).replace(' ', 'T')) - new Date(String(b.fecha_reserva).replace(' ', 'T'))),
    [reservas],
  );

  const counts = useMemo(() => ({
    total: activas.length,
    pendiente: activas.filter((r) => r.estado === 'pendiente').length,
    confirmada: activas.filter((r) => r.estado === 'confirmada').length,
  }), [activas]);

  const uid = user?.id_usuario ?? 1;

  const cancelar = async (r) => {
    const nombre = cliMap.get(r.id_cliente) || `Cliente #${r.id_cliente}`;
    if (!window.confirm(`¿Cancelar la reserva de ${nombre}?`)) return;
    try {
      await reservasService.updateReserva(r.id_reserva, {
        id_cliente: r.id_cliente,
        id_mesa: r.id_mesa,
        fecha_reserva: r.fecha_reserva,
        tamano_grupo: r.tamano_grupo,
        estado: 'cancelada',
        notas: r.notas,
        creado_por: r.creado_por ?? uid,
        actualizado_por: uid,
      });
      showToast('Reserva cancelada', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error cancelando la reserva', 'urgent');
    }
  };

  return <>
    <PageIntro
      eyebrow="Operación"
      title="Reservas"
      description="Reservaciones activas del restaurante. Solo consulta y cancelación."
      action={<button className="ghost-btn" onClick={load} disabled={refreshing}><RefreshCw size={17} className={refreshing ? 'spin' : ''} /> Actualizar</button>}
    />

    <div className="resv-stats-row">
      <div className="resv-stat">
        <span className="resv-stat-icon total"><LayoutList size={18} /></span>
        <div><strong>{counts.total}</strong><small>Reservas activas</small></div>
      </div>
      <div className="resv-stat">
        <span className="resv-stat-icon pendiente"><Hourglass size={18} /></span>
        <div><strong>{counts.pendiente}</strong><small>Pendientes</small></div>
      </div>
      <div className="resv-stat">
        <span className="resv-stat-icon confirmada"><CheckCheck size={18} /></span>
        <div><strong>{counts.confirmada}</strong><small>Confirmadas</small></div>
      </div>
    </div>

    <section className="panel">
      <div className="panel-head">
        <div>
          <h3>Próximas reservas</h3>
          <p>Ordenadas por fecha · las más cercanas primero</p>
        </div>
        <CalendarClock size={20} />
      </div>

      {reservas === null ? (
        <EmptyPanel title="Cargando reservas..." text="Consultando /reservas." />
      ) : activas.length === 0 ? (
        <EmptyPanel
          title="Sin reservas activas"
          text="Las reservas pendientes y confirmadas aparecerán aquí."
        />
      ) : (
        <motion.div className="resv-list" variants={listVariants} initial="hidden" animate="show">
          {activas.map((r) => {
            const nombre = cliMap.get(r.id_cliente) || `Cliente #${r.id_cliente}`;
            const cuando = partesFecha(r.fecha_reserva);
            return (
              <motion.div className={`resv-card ${r.estado}`} key={r.id_reserva} variants={cardVariants} layout>
                <div className="resv-when" title={cuando ? cuando.completa : ''}>
                  <strong>{cuando ? cuando.hora : '--:--'}</strong>
                  <span>{cuando ? `${cuando.dia} ${cuando.mes}` : 'sin fecha'}</span>
                </div>
                <span className="resv-avatar">{nombre.charAt(0).toUpperCase()}</span>
                <div className="resv-info">
                  <strong>
                    {nombre}
                    <em className="resv-id">R-{String(r.id_reserva).padStart(3, '0')}</em>
                  </strong>
                  <small>
                    <span><Store size={12} /> Mesa {mesaMap.get(r.id_mesa) || r.id_mesa}</span>
                    <span><Users size={12} /> {r.tamano_grupo ?? 0} {(r.tamano_grupo ?? 0) === 1 ? 'persona' : 'personas'}</span>
                  </small>
                  {r.notas && <p className="resv-note">“{r.notas}”</p>}
                </div>
                <div className="resv-side">
                  <span className={`resv-status ${r.estado}`}>{ESTADO_LABELS[r.estado] || r.estado}</span>
                  <button className="resv-mini-btn danger" title="Cancelar reserva" onClick={() => cancelar(r)} type="button">
                    <X size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </section>
  </>;
}
