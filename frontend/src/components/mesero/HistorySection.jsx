import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollText, Eye, DollarSign } from 'lucide-react';
import { ordenesService } from '../../services';
import { formatMoney, formatDateTime } from '../../services/format';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';
import OrderDetailModal from '../OrderDetailModal';
import EmptyState from '../EmptyState';

export default function HistorySection() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const all = await ordenesService.getOrdenes();
      if (Array.isArray(all)) {
        const propias = user?.role === 'admin'
          ? all
          : all.filter((o) => o.id_mesero === user?.id_usuario);
        // Filtrar órdenes que ya fueron servidas, pagadas o canceladas
        const historico = propias.filter((o) =>
          ['servido', 'pagado', 'cancelado', 'served', 'paid', 'cancelled'].includes(o.estado)
        );
        historico.sort((a, b) => (b.id_orden || 0) - (a.id_orden || 0));
        setOrders(historico);
      }
    } catch (e) {
      console.error('Error al cargar historial:', e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const initialLoad = setTimeout(loadHistory, 0);
    return () => clearTimeout(initialLoad);
  }, [loadHistory]);

  // Total acumulado de ventas del mesero
  const totalVendido = useMemo(() => {
    return (orders || [])
      .filter((o) => o.estado === 'pagado' || o.estado === 'servido')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  }, [orders]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Historial de Comandas</h1>
          <p className="subtitle">Registro de servicios finalizados</p>
        </div>
      </div>

      {/* Tarjeta de Resumen del Turno */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem',
          background: 'var(--gradient-card, #fff)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              background: 'var(--success-soft)',
              color: 'var(--success)',
              padding: '0.6rem',
              borderRadius: '8px',
            }}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ventas Atendidas en el Turno</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--success)' }}>
              {formatMoney(totalVendido)}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Comandas Finalizadas</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{orders.length}</div>
        </div>
      </div>

      {/* Tabla de Historial */}
      <div className="card">
        <div className="card-body table-container">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Cargando historial de comandas...
            </p>
          ) : orders.length === 0 ? (
            <EmptyState icon={<ScrollText size={24} />} title="No hay historial registrado aún" />
          ) : (
            <table>
              <thead>
                <tr>
                  <th># Comanda</th>
                  <th>Mesa</th>
                  <th>Estado</th>
                  <th>Total</th>
                  <th>Fecha y Hora</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id_orden}>
                    <td>
                      <strong>#{o.id_orden}</strong>
                    </td>
                    <td>Mesa #{o.id_mesa || 'Barra'}</td>
                    <td>
                      <StatusBadge status={o.estado} />
                    </td>
                    <td>
                      <strong>{formatMoney(o.total)}</strong>
                    </td>
                    <td>{formatDateTime(o.creado_en)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        onClick={() => setDetail(o)}
                      >
                        <Eye size={14} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}
