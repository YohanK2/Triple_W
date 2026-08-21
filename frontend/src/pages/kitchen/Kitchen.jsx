import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check, ChefHat, Clock3, ClipboardList, Flame, RefreshCw, Timer, UtensilsCrossed, Store, UserRound, StickyNote } from 'lucide-react';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { useOrders } from '../../context/ordersCore';
import { formatMoney } from '../../services/format';
import '../../styles/Orders.css';

const COLUMNAS = [
  { estado: 'pendiente', titulo: 'Nuevas órdenes', icon: Flame, accion: 'Iniciar preparación', ActionIcon: ChefHat },
  { estado: 'preparacion', titulo: 'En preparación', icon: ChefHat, accion: 'Marcar lista', ActionIcon: Check },
  { estado: 'lista', titulo: 'Listas', icon: Check, accion: 'Marcar entregada', ActionIcon: UtensilsCrossed },
];

export default function Kitchen() {
  const { orders, loading, refresh, advanceOrder } = useOrders();
  const { showToast } = useToast();

  const porColumna = useMemo(() => ({
    pendiente: orders.filter((o) => o.estado === 'pendiente'),
    preparacion: orders.filter((o) => o.estado === 'preparacion'),
    lista: orders.filter((o) => o.estado === 'lista'),
  }), [orders]);

  const handleAdvance = async (o) => {
    try {
      await advanceOrder(o.id);
      showToast(`Orden #${o.id} actualizada`, 'success');
    } catch (err) {
      showToast(err.message || 'Error actualizando orden', 'urgent');
    }
  };

  return <>
    <div className="kitchen-hero">
      <div>
        <span className="page-eyebrow">KDS · Cocina</span>
        <h2>Pantalla de preparación</h2>
        <p>Cola de comandas sincronizada con la base de datos.</p>
      </div>
      <button className="secondary-btn" onClick={refresh} disabled={loading}>
        <RefreshCw size={17} /> Actualizar
      </button>
    </div>
    <div className="kitchen-stats">
      <div><span>Nuevas</span><strong>{porColumna.pendiente.length}</strong></div>
      <div><span>En preparación</span><strong>{porColumna.preparacion.length}</strong></div>
      <div><span>Listas</span><strong>{porColumna.lista.length}</strong></div>
    </div>
    <div className="kitchen-columns">
      {COLUMNAS.map(({ estado, titulo, icon: Icon, accion, ActionIcon }) => (
        <section className="kitchen-column" key={estado}>
          <div className="column-title"><Icon size={18} /> {titulo}</div>
          {porColumna[estado].length === 0 ? (
            <EmptyPanel
              title={loading ? 'Cargando...' : 'Sin comandas'}
              text={`Órdenes en estado "${titulo.toLowerCase()}" aparecerán aquí.`}
            />
          ) : (
            <div className="ord-list" style={{ gridTemplateColumns: '1fr' }}>
              {porColumna[estado].map((o) => (
                <motion.div
                  className="ord-card" key={o.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                >
                  <div className="ord-card-top">
                    <span className="ord-id"><ClipboardList size={15} color="var(--gold)" /> Orden #{o.id}</span>
                    <span className={`ord-status ${o.estado}`}>{titulo}</span>
                  </div>
                  <div className="ord-meta" style={{ marginLeft: 0 }}>
                    <span><Store size={13} /> Mesa {o.mesa}</span>
                    <span><UserRound size={13} /> {o.mesero}</span>
                    <span><Clock3 size={13} /> {o.hora}</span>
                  </div>
                  <div className="ord-items">
                    {o.items.map((i) => (
                      <span className="ord-item-chip" key={i.id || i.nombre}>
                        <b>{i.cantidad}×</b> {i.nombre}
                      </span>
                    ))}
                  </div>
                  {o.notas && <div className="ord-note"><StickyNote size={13} /> {o.notas}</div>}
                  <div className="ord-card-bottom">
                    <div className="ord-total"><small>Total</small>{formatMoney(o.total)}</div>
                    <div className="ord-actions">
                      <motion.button
                        type="button" className="primary-btn" onClick={() => handleAdvance(o)}
                        whileTap={{ scale: 0.97 }}
                      >
                        <ActionIcon size={15} /> {accion}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
    <div className="kitchen-timer-note">
      <Timer size={16} /> Al marcar «entregada» la orden queda lista para cobro en Caja.
    </div>
  </>;
}
