import { useCallback, useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import { api } from '../../api';
import { formatMoney, formatDateKey } from '../../utils/format';
import EmptyState from '../../components/EmptyState';

export default function RevenueSection() {
  const defaultFrom = () => formatDateKey(new Date(Date.now() - 30 * 86400000));
  const defaultTo = () => formatDateKey(new Date());

  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getRevenue(from, to);
      setData(res);
    } catch (e) {
      setData([]);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reporte de Ingresos</h1>
          <p className="subtitle">Análisis financiero detallado</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input type="date" className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} style={{ width: 'auto' }} />
          <input type="date" className="form-control" value={to} onChange={(e) => setTo(e.target.value)} style={{ width: 'auto' }} />
          <button className="btn btn-primary btn-sm" onClick={load}>Consultar</button>
        </div>
      </div>

      <div className="card">
        <div className="card-body table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Transacciones</th>
                <th>Ingreso Total</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {data !== null && data.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <EmptyState icon={<Banknote size={22} />} title="Sin ingresos en el rango" description="Selecciona un rango de fechas y presiona Consultar para ver el reporte." />
                  </td>
                </tr>
              )}
              {data !== null &&
                data.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.transactions_count}</td>
                    <td><strong>{formatMoney(d.total_revenue)}</strong></td>
                    <td>{formatMoney(d.avg_transaction)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
