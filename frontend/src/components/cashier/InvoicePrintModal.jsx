import { useEffect, useRef, useState } from 'react';
import { Printer } from 'lucide-react';
import { menuService, ordenesService } from '../../services';
import { formatDateTime, formatMoney } from '../../services/format';
import Modal from '../Modal';

export default function InvoicePrintModal({ invoice, order: providedOrder, onClose }) {
  const [order, setOrder] = useState(providedOrder || null);
  const [items, setItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);
  const orderId = invoice?.id_orden || providedOrder?.id_orden;

  useEffect(() => {
    let mounted = true;

    async function loadDetails() {
      if (!orderId) {
        setLoading(false);
        return;
      }

      const [orderRes, itemsRes, menuRes] = await Promise.allSettled([
        providedOrder ? Promise.resolve(providedOrder) : ordenesService.getOrden(orderId),
        ordenesService.getItemsByOrden(orderId),
        menuService.getItems(),
      ]);

      if (!mounted) return;
      if (orderRes.status === 'fulfilled' && orderRes.value) setOrder(orderRes.value);
      if (itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value)) setItems(itemsRes.value);
      if (menuRes.status === 'fulfilled' && Array.isArray(menuRes.value)) setMenuItems(menuRes.value);
      setLoading(false);
    }

    loadDetails().catch((error) => {
      console.error('Error al cargar ticket:', error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [orderId, providedOrder]);

  const getItemName = (item) => {
    if (item.nombre) return item.nombre;
    const menuItem = menuItems.find((menu) => menu.id_item_menu === item.id_item_menu);
    return menuItem?.nombre || `Platillo #${item.id_item_menu}`;
  };

  return (
    <Modal title="Comprobante / Ticket" onClose={onClose} maxWidth={480}>
      <div className="invoice-modal-content">
      <div ref={printRef} className="invoice-print" style={{ background: '#fff', color: '#000', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.82rem', width: '100%', maxWidth: 340, margin: '0 auto', border: '1px solid #ccc', overflowWrap: 'anywhere' }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: '0 0 0.2rem', fontSize: '1.2rem' }}>RESTAURANT MANAGER</h2>
          <p style={{ margin: 0 }}>Triple W Gastronomía S.A.</p>
          <p style={{ margin: 0 }}>RFC: REST260819-ABC</p>
          <p style={{ margin: 0 }}>Av. Principal #123 · Tel: (555) 019-2834</p>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <div><strong>Factura:</strong> {invoice?.numero_factura || `FAC-${orderId}`}</div>
          <div><strong>Comanda:</strong> #{orderId} · Mesa #{order?.id_mesa || 'Barra'}</div>
          <div><strong>Fecha:</strong> {formatDateTime(invoice?.fecha_emision || '')}</div>
          <div><strong>Pago:</strong> {(invoice?.metodo_pago || 'efectivo').toUpperCase()}</div>
          {invoice?.numero_referencia && <div><strong>Referencia:</strong> {invoice.numero_referencia}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0' }}>
          {loading ? <div>Cargando detalle...</div> : items.length === 0 ? <div>Sin detalle de platillos</div> : items.map((item, index) => (
            <div key={item.id_item_orden || index} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', margin: '0.2rem 0' }}>
              <span style={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>{item.cantidad}x {getItemName(item)}</span>
              <span style={{ whiteSpace: 'nowrap' }}>{formatMoney(item.subtotal)}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'right', marginTop: '0.75rem' }}>
          <div>Subtotal: {formatMoney(invoice?.subtotal ?? order?.subtotal)}</div>
          <div>IVA (16%): {formatMoney(invoice?.impuesto ?? order?.impuesto)}</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: '0.3rem' }}>TOTAL: {formatMoney(invoice?.total ?? order?.total)}</div>
          {invoice?.metodo_pago === 'efectivo' && invoice?.cambio !== undefined && (
            <div style={{ marginTop: '0.3rem' }}>Cambio: {formatMoney(invoice.cambio)}</div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', borderTop: '1px dashed #000', paddingTop: '0.75rem' }}>
          <p style={{ margin: 0 }}>¡GRACIAS POR SU PREFERENCIA!</p>
          <p style={{ margin: 0 }}>Este ticket sirve como comprobante de pago.</p>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <Printer size={16} /> Imprimir Ticket
        </button>
      </div>
      </div>
    </Modal>
  );
}
