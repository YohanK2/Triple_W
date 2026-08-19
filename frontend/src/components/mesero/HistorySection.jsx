import { useCallback, useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { api } from '../../services';
import { formatMoney, formatDateTime } from '../../services/format';
import StatusBadge from '../../components/StatusBadge';
import OrderDetailModal from '../../components/OrderDetailModal';
import EmptyState from '../../components/EmptyState';

export default function HistorySection() {
  const [orders, setOrders] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      const all = await api.getOrders({});
      setOrders((all || []).filter((o) => ['paid', 'cancelled'].includes(o.status)));
    } catch (e) {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function viewOrder(id) {
    try {
      setDetail(await api.getOrder(id));
    } catch (e) {
      /* ignore */
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Historial</h1>
          <p className="subtitle">Órdenes completadas</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mesa</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders !== null && orders.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState icon={<ScrollText size={22} />} title="Sin historial" />
                  </td>
                </tr>
              )}
              {orders !== null &&
                orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.id}</strong></td>
                    <td>Mesa {o.table_number}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td><strong>{formatMoney(o.total)}</strong></td>
                    <td>{formatDateTime(o.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewOrder(o.id)}>Ver</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
