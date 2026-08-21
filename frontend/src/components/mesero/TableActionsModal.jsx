import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, CalendarPlus, UtensilsCrossed, ArrowLeft, UserRound,
  Users, Clock3, Minus, Plus, Check,
} from 'lucide-react';
import { clientesService } from '../../services/clientesService';
import { reservasService } from '../../services/reservasService';
import { mesasService } from '../../services/mesasService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Salon.css';

const paneVariants = {
  enter: { opacity: 0, x: 46 },
  center: { opacity: 1, x: 0, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
  exit: { opacity: 0, x: -46 },
};

const itemVariants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

function TableActionsCard({ table, onClose, onOrder, onReserved }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('menu');
  const [nombre, setNombre] = useState('');
  const [personas, setPersonas] = useState(2);
  const [hora, setHora] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submitReserve = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    setError('');
    try {
      const uid = user?.id_usuario ?? 1;
      /* find-or-create cliente por nombre */
      const clientes = await clientesService.getClientes();
      let idCliente = clientes.find(
        (c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase(),
      )?.id_cliente;
      if (!idCliente) {
        await clientesService.createCliente({
          nombre: nombre.trim(),
          telefono: '',
          correo: '',
          direccion: '',
          puntos_fidelidad: 0,
          creado_por: uid,
          actualizado_por: uid,
        });
        const actualizados = await clientesService.getClientes();
        idCliente = actualizados.find(
          (c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase(),
        )?.id_cliente;
      }

      const hoy = new Date().toISOString().slice(0, 10);
      const fechaReserva = hora ? `${hoy}T${hora}:00` : new Date().toISOString().slice(0, 19);

      await reservasService.createReserva({
        id_cliente: idCliente,
        id_mesa: table.id,
        fecha_reserva: fechaReserva,
        tamano_grupo: personas,
        estado: 'confirmada',
        notas: '',
        creado_por: uid,
        actualizado_por: uid,
      });

      await mesasService.setEstado(table.id, 'reservada', uid);

      onReserved(`Reserva de ${nombre.trim()} registrada`);
      onClose();
    } catch (err) {
      setError(err.message || 'Error creando la reserva');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="tm-card" role="dialog" aria-modal="true"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 14 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
    >
      <div className="tm-header">
        <div>
          <span className="tm-kicker">Mesa {String(table.numero_mesa).padStart(2, '0')} · Libre</span>
          <h3>{mode === 'menu' ? '¿Qué deseas hacer?' : 'Reservar mesa'}</h3>
        </div>
        <button type="button" className="tm-close" onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>

      <div className="tm-content">
        <AnimatePresence mode="wait" initial={false}>
          {mode === 'menu' ? (
            <motion.div
              key="menu" variants={paneVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <motion.p className="tm-hint" variants={itemVariants}>
                Esta mesa está disponible ahora mismo.
              </motion.p>

              <motion.button
                type="button" className="tm-option" onClick={() => setMode('reserve')}
                variants={itemVariants} whileTap={{ scale: 0.98 }}
              >
                <span className="tm-option-icon gold"><CalendarPlus size={19} /></span>
                <span className="tm-option-text">
                  <strong>Reservar</strong>
                  <small>Registrar la reserva de esta mesa</small>
                </span>
              </motion.button>

              <motion.button
                type="button" className="tm-option" onClick={onOrder}
                variants={itemVariants} whileTap={{ scale: 0.98 }}
              >
                <span className="tm-option-icon brown"><UtensilsCrossed size={19} /></span>
                <span className="tm-option-text">
                  <strong>Hacer una orden</strong>
                  <small>Iniciar una comanda para esta mesa</small>
                </span>
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="reserve" onSubmit={submitReserve}
              variants={paneVariants} initial="enter" animate="center" exit="exit"
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              <motion.div className="tm-field" variants={itemVariants}>
                A nombre de
                <div className="tm-input-wrap">
                  <UserRound size={15} className="tm-lead" />
                  <input
                    type="text" className="tm-input" placeholder="Ej. Carolina Méndez"
                    value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  />
                </div>
              </motion.div>

              <motion.div className="tm-field" variants={itemVariants}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={13} /> ¿Cuántas personas?
                </span>
                <div className="tm-stepper">
                  <button type="button" className="tm-step-btn" aria-label="Menos personas"
                    disabled={personas <= 1} onClick={() => setPersonas((p) => p - 1)}
                  >
                    <Minus size={15} />
                  </button>
                  <span className="tm-step-value">{personas} {personas === 1 ? 'persona' : 'personas'}</span>
                  <button type="button" className="tm-step-btn" aria-label="Más personas"
                    disabled={personas >= 20} onClick={() => setPersonas((p) => p + 1)}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </motion.div>

              <motion.div className="tm-field" variants={itemVariants}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock3 size={13} /> Hora (opcional)
                </span>
                <div className="tm-input-wrap">
                  <Clock3 size={15} className="tm-lead" />
                  <input
                    type="time" className="tm-input" value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
              </motion.div>

              {error && <div className="login-error" role="alert" style={{ margin: 0 }}>{error}</div>}

              <motion.div className="tm-actions" variants={itemVariants}>
                <button type="button" className="ghost-btn back-btn" onClick={() => setMode('menu')}>
                  <ArrowLeft size={14} /> Volver
                </button>
                <button type="submit" className="primary-btn" disabled={saving}>
                  <Check size={15} /> {saving ? 'Guardando...' : 'Confirmar reserva'}
                </button>
              </motion.div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function TableActionsModal({ table, onClose, onOrder, onReserved }) {
  const isOpen = table !== null;

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="tm-overlay" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <div className="tm-wrapper">
            <TableActionsCard
              key={table.id}
              table={table}
              onClose={onClose}
              onOrder={() => { onClose(); onOrder(table); }}
              onReserved={onReserved}
            />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
