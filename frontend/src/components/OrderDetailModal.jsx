import { StickyNote } from 'lucide-react';
import { formatMoney, formatDateTime } from '../utils/format';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

export default function OrderDetailModal({ order, onClose }) {
  if (!order) return null;

  return (
    <Modal title="Detalles de Orden" onClose={onClose}>
      <div style={{ marginBottom: '1rem' }}>
        <div className="flex-between">
          <strong>Orden #{order.id}</strong>
          <StatusBadge status={order.status} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
          Mesa {order.table_number} · {order.server_name || '-'} · {formatDateTime(order.created_at)}
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Cant</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>{i.item_name}</td>
                <td>{i.quantity}</td>
                <td>{formatMoney(i.unit_price)}</td>
                <td>{formatMoney(i.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.notes ? (
        <p className="text-icon" style={{ fontSize: '0.85rem', color: 'var(--warning)', marginTop: '0.8rem' }}>
          <StickyNote size={14} /> {order.notes}
        </p>
      ) : null}

      <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '0.9rem' }}>
        <div>
          Subtotal: {formatMoney(order.subtotal)}
        </div>
        <div>
          Impuesto: {formatMoney(order.tax)}
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--success)', marginTop: '0.3rem' }}>
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
