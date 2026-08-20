import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ClipboardList } from 'lucide-react';
import { ordenesService } from '../../services';
import { formatMoney, formatDateTime } from '../../services/format';
import StatusBadge from '../../components/StatusBadge';
import OrderDetailModal from '../../components/OrderDetailModal';
import EmptyState from '../../components/EmptyState';

const STATUS_FILTERS = [
  ['', 'Todos los estados'],
  ['pendiente', 'Pendiente'],
  ['preparando', 'Preparando'],
  ['listo', 'Lista'],
  ['servido', 'Servido'],
  ['pagado', 'Pagado'],
  ['cancelado', 'Cancelado'],
];

export default function OrdersSection() {
  const [orders, setOrders] = useState(null);
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await ordenesService.getOrdenes();
      let filtered = data;
      if (status) filtered = data.filter((o) => o.estado === status);
      setOrders(filtered);
    } catch (e) {
      setOrders([]);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function viewOrder(id) {
    try {
      const order = await ordenesService.getOrden(id);
      setDetail(order);
    } catch (e) {
      /* ignore */
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Historial de Órdenes</h1>
          <p className="subtitle">Todas las órdenes del sistema</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
            {STATUS_FILTERS.map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={16} /></button>
        </div>
      </div>

      <div className="card">
        <div className="card-body table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Mesa</th>
                <th>Mesero</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders !== null && orders.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <EmptyState icon={<ClipboardList size={22} />} title="No hay órdenes" description="Las órdenes creadas por los meseros aparecerán aquí." />
                  </td>
                </tr>
              )}
              {orders !== null &&
                orders.map((o) => (
                  <tr key={o.id_orden}>
                    <td><strong>#{o.id_orden}</strong></td>
                    <td>Mesa #{o.id_mesa || 'Barra'}</td>
                    <td>{o.id_mesero || '-'}</td>
                    <td><StatusBadge status={o.estado} /></td>
                    <td><strong>{formatMoney(o.total)}</strong></td>
                    <td>{formatDateTime(o.creado_en)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewOrder(o.id_orden)}>Ver</button>
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
