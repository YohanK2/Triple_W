import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock, Users, Clock3, Store, Check, X, CheckCheck, Hourglass, LayoutList, Trash2, RefreshCw,
} from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { reservasService } from '../../services/reservasService';
import { clientesService } from '../../services/clientesService';
import { mesasService } from '../../services/mesasService';

const FILTERS = [
  { key: 'todas', label: 'Todas', icon: LayoutList },
  { key: 'confirmada', label: 'Confirmadas', icon: CheckCheck },
  { key: 'pendiente', label: 'Pendientes', icon: Hourglass },
  { key: 'cancelada', label: 'Canceladas', icon: X },
  { key: 'completada', label: 'Completadas', icon: Check },
];

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

function fmtFechaHora(fechaReserva) {
  const d = new Date(String(fechaReserva).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(fechaReserva);
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Reservas() {
  const { showToast } = useToast();
  const [reservas, setReservas] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [filtro, setFiltro] = useState('todas');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [rs, cs, ms] = await Promise.all([
        reservasService.getReservas(),
        clientesService.getClientes(),
        mesasService.getMesas(),
      ]);
      rs.sort((a, b) => b.id_reserva - a.id_reserva);
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

  const filtradas = useMemo(
    () => (filtro === 'todas' ? reservas || [] : (reservas || []).filter((r) => r.estado === filtro)),
    [reservas, filtro],
  );

  const setEstado = async (r, estado) => {
    try {
      await reservasService.updateReserva(r.id_reserva, {
        id_cliente: r.id_cliente,
        id_mesa: r.id_mesa,
        fecha_reserva: r.fecha_reserva,
        tamano_grupo: r.tamano_grupo,
        estado,
        notas: r.notas,
        creado_por: r.creado_por ?? 1,
        actualizado_por: r.actualizado_por ?? 1,
      });
      showToast(`Reserva ${estado}`, 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error actualizando reserva', 'urgent');
    }
  };

  const remove = async (r) => {
    if (!window.confirm('¿Eliminar esta reserva?')) return;
    try {
      await reservasService.deleteReserva(r.id_reserva);
      showToast('Reserva eliminada', 'success');
      load();
    } catch (err) {
      showToast(err.message || 'Error eliminando reserva', 'urgent');
    }
  };

  const counts = useMemo(() => ({
    total: (reservas || []).length,
    confirmada: (reservas || []).filter((r) => r.estado === 'confirmada').length,
    pendiente: (reservas || []).filter((r) => r.estado === 'pendiente').length,
  }), [reservas]);

  return <>
    <PageIntro
      eyebrow="Operación"
      title="Reservas"
      description="Consulta y administra las reservas del salón."
      action={<button className="ghost-btn" onClick={load} disabled={refreshing}><RefreshCw size={17} /> Actualizar</button>}
    />

    <div className="resv-filters">
      {FILTERS.map(({ key, label, icon: Icon }) => (
        <button
          key={key} className={`filter-chip ${filtro === key ? 'active' : ''}`}
          onClick={() => setFiltro(key)} type="button"
        >
          <Icon size={14} /> {label}
        </button>
      ))}
    </div>

    <div className="resv-layout">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h3>Listado de reservas</h3>
            <p>{filtradas.length} {filtradas.length === 1 ? 'reserva' : 'reservas'} en la vista actual</p>
          </div>
          <CalendarClock size={20} />
        </div>

        {reservas === null ? (
          <EmptyPanel title="Cargando reservas..." text="Consultando /reservas." />
        ) : filtradas.length === 0 ? (
          <EmptyPanel
            title="Sin reservas aquí"
            text="Las reservas se crean desde Salón y mesas al reservar una mesa libre."
          />
        ) : (
          <motion.div className="resv-list" variants={listVariants} initial="hidden" animate="show" key={filtro}>
            {filtradas.map((r) => {
              const nombre = cliMap.get(r.id_cliente) || `Cliente #${r.id_cliente}`;
              return (
                <motion.div className="resv-card" key={r.id_reserva} variants={cardVariants} layout>
                  <span className="resv-avatar">{nombre.charAt(0).toUpperCase()}</span>
                  <div className="resv-info">
                    <strong>{nombre}</strong>
                    <small>
                      <span><Store size={12} /> Mesa {mesaMap.get(r.id_mesa) || r.id_mesa}</span>
                      <span><Users size={12} /> {r.tamano_grupo ?? 0} {(r.tamano_grupo ?? 0) === 1 ? 'persona' : 'personas'}</span>
                      <span><Clock3 size={12} /> {fmtFechaHora(r.fecha_reserva)}</span>
                    </small>
                  </div>
                  <div className="resv-side">
                    <span className={`resv-status ${r.estado}`}>{r.estado}</span>
                    <div className="resv-actions">
                      {r.estado !== 'confirmada' && r.estado !== 'completada' && (
                        <button className="resv-mini-btn" title="Confirmar reserva" onClick={() => setEstado(r, 'confirmada')} type="button">
                          <Check size={15} />
                        </button>
                      )}
                      {r.estado !== 'cancelada' && r.estado !== 'completada' && (
                        <button className="resv-mini-btn danger" title="Cancelar reserva" onClick={() => setEstado(r, 'cancelada')} type="button">
                          <X size={15} />
                        </button>
                      )}
                      <button className="resv-mini-btn danger" title="Eliminar reserva" onClick={() => remove(r)} type="button">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

      <aside className="panel resv-stats-panel">
        <div className="panel-head">
          <div>
            <h3>Resumen</h3>
            <p>Estado general de las reservas</p>
          </div>
          <CalendarClock size={20} />
        </div>
        <div className="resv-stats">
          <div className="resv-stat">
            <span className="resv-stat-icon total"><LayoutList size={18} /></span>
            <div><strong>{counts.total}</strong><small>Total de reservas</small></div>
          </div>
          <div className="resv-stat">
            <span className="resv-stat-icon confirmada"><CheckCheck size={18} /></span>
            <div><strong>{counts.confirmada}</strong><small>Confirmadas</small></div>
          </div>
          <div className="resv-stat">
            <span className="resv-stat-icon pendiente"><Hourglass size={18} /></span>
            <div><strong>{counts.pendiente}</strong><small>Pendientes</small></div>
          </div>
        </div>
      </aside>
    </div>
  </>;
}
