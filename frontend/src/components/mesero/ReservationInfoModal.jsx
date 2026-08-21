import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Users, Clock3, CalendarCheck2 } from 'lucide-react';
import '../../styles/Salon.css';

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export default function ReservationInfoModal({ reserva, onClose }) {
  useEffect(() => {
    if (!reserva) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!reserva]);

  return (
    <AnimatePresence>
      {reserva && (
        <>
          <motion.div
            className="tm-overlay" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          <div className="tm-wrapper">
            <motion.div
              className="tm-card" role="dialog" aria-modal="true"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            >
              <div className="tm-header">
                <div>
                  <span className="tm-kicker">Mesa {String(reserva.numero).padStart(2, '0')}</span>
                  <h3>Información de la reserva</h3>
                </div>
                <button type="button" className="tm-close" onClick={onClose} aria-label="Cerrar">
                  <X size={18} />
                </button>
              </div>

              <motion.div
                className="tm-content" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
                initial="hidden" animate="show"
              >
                <motion.span className="tm-badge-reservada" variants={itemVariants}>
                  <CalendarCheck2 size={13} /> Reservada
                </motion.span>

                <motion.div className="tm-guest" variants={itemVariants}>
                  <span className="tm-guest-avatar">{reserva.clienteNombre.charAt(0).toUpperCase()}</span>
                  <div>
                    <strong>{reserva.clienteNombre}</strong>
                    <small>Reserva a nombre de esta persona</small>
                  </div>
                </motion.div>

                <motion.div className="tm-info-row" variants={itemVariants}>
                  <Users size={15} color="var(--gold)" />
                  Personas
                  <strong>{reserva.personas} {reserva.personas === 1 ? 'persona' : 'personas'}</strong>
                </motion.div>

                <motion.div className="tm-info-row" variants={itemVariants}>
                  <Clock3 size={15} color="var(--gold)" />
                  Fecha y hora
                  <strong>{reserva.fechaHora}</strong>
                </motion.div>

                <motion.div className="tm-actions" variants={itemVariants}>
                  <button type="button" className="primary-btn full" onClick={onClose}>
                    Entendido
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
