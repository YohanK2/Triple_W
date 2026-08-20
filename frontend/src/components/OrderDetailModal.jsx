import { useEffect, useState } from 'react';
import { StickyNote, Loader2 } from 'lucide-react';
import { ordenesService, menuService } from '../services';
import { formatMoney, formatDateTime } from '../services/format';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

export default function OrderDetailModal({ order, onClose }) {
  const [items, setItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrderItems() {
      if (!order?.id_orden) return;
      try {
        setLoading(true);
        const [itemsData, allMenu] = await Promise.allSettled([
          ordenesService.getItemsOrden(),
          menuService.getItems(),
        ]);

        if (isMounted) {
          const menuList = allMenu.status === 'fulfilled' && Array.isArray(allMenu.value) ? allMenu.value : [];
          setMenuItems(menuList);

          if (itemsData.status === 'fulfilled' && Array.isArray(itemsData.value)) {
            // Filtrar solo los ítems pertenecientes a esta orden
            const filtered = itemsData.value.filter((i) => i.id_orden === order.id_orden);
            setItems(filtered);
          } else {
            setItems([]);
          }
        }
      } catch (err) {
        console.error('Error al cargar items de la orden:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadOrderItems();
    return () => {
      isMounted = false;
    };
  }, [order?.id_orden]);

  if (!order) return null;

  // Obtener el nombre del platillo desde el catálogo
  const getItemName = (idItemMenu) => {
    const found = menuItems.find((m) => m.id_item_menu === idItemMenu);
    return found ? found.nombre : `Platillo #${idItemMenu}`;
  };

  return (
    <Modal title={`Detalles de Comanda #${order.id_orden}`} onClose={onClose}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="flex-between" style={{ alignItems: 'center' }}>
          <strong>Mesa #{order.id_mesa || 'Barra'}</strong>
          <StatusBadge status={order.estado} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          Registrada: {formatDateTime(order.creado_en)}
        </p>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem', gap: '0.5rem' }}>
            <Loader2 size={20} className="animate-spin" />
            <span>Cargando platillos...</span>
          </div>
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
            No se encontraron ítems detallados para esta comanda.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Platillo</th>
                <th style={{ textAlign: 'center' }}>Cant</th>
                <th style={{ textAlign: 'right' }}>P. Unit</th>
                <th style={{ textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id_item_orden || Math.random()}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{getItemName(i.id_item_menu)}</div>
                    {i.instrucciones_especiales && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>
                        Nota: {i.instrucciones_especiales}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{i.cantidad}</td>
                  <td style={{ textAlign: 'right' }}>{formatMoney(i.precio_unitario)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoney(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {order.notas && (
        <div
          style={{
            background: 'var(--warning-soft)',
            padding: '0.6rem 0.8rem',
            borderRadius: '6px',
            color: 'var(--warning)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <StickyNote size={16} />
          <span>Notas generales: {order.notas}</span>
        </div>
      )}

      {/* Resumen Financiero */}
      <div style={{ textAlign: 'right', marginTop: '1.25rem', fontSize: '0.9rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
        <div style={{ color: 'var(--text-muted)' }}>
          Subtotal: {formatMoney(order.subtotal)}
        </div>
        <div style={{ color: 'var(--text-muted)', margin: '0.2rem 0' }}>
          IVA (16%): {formatMoney(order.impuesto)}
        </div>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.4rem' }}>
          Total: {formatMoney(order.total)}
        </div>
      </div>

      <div style={{ textAlign: 'right', marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </Modal>
  );
}