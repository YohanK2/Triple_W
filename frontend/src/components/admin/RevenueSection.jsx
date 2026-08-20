import { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, CreditCard, DollarSign, Printer, Receipt, RefreshCw, TrendingUp } from 'lucide-react';
import { facturasService } from '../../services';
import { formatDateKey, formatDateTime, formatMoney } from '../../services/format';
import EmptyState from '../../components/EmptyState';
import InvoicePrintModal from '../cashier/InvoicePrintModal';

const DEFAULT_TO = formatDateKey(new Date());
const DEFAULT_FROM = formatDateKey(new Date(Date.now() - 30 * 86400000));

export default function RevenueSection() {
  const [from, setFrom] = useState(DEFAULT_FROM);
  const [to, setTo] = useState(DEFAULT_TO);
  const [facturas, setFacturas] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFacturas = useCallback(async () => {
    try {
      const data = await facturasService.getFacturas();
      setFacturas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(loadFacturas, 0);
    return () => clearTimeout(initialLoad);
  }, [loadFacturas]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadFacturas();
    setRefreshing(false);
  }

  const facturasFiltradas = useMemo(() => (
    (facturas || [])
      .filter((factura) => {
        const fecha = String(factura.fecha_emision || '').slice(0, 10);
        return !fecha || (fecha >= from && fecha <= to);
      })
      .sort((a, b) => (b.id_factura || 0) - (a.id_factura || 0))
  ), [facturas, from, to]);

  const totalIngresos = useMemo(
    () => facturasFiltradas.reduce((sum, factura) => sum + (Number(factura.total) || 0), 0),
    [facturasFiltradas]
  );

  const ticketPromedio = facturasFiltradas.length > 0 ? totalIngresos / facturasFiltradas.length : 0;

  const desgloseMetodos = useMemo(() => {
    const totals = { efectivo: 0, tarjeta: 0, transferencia: 0 };
    facturasFiltradas.forEach((factura) => {
      const metodo = String(factura.metodo_pago || 'efectivo').toLowerCase();
      const key = Object.prototype.hasOwnProperty.call(totals, metodo) ? metodo : 'efectivo';
      totals[key] += Number(factura.total) || 0;
    });
    return totals;
  }, [facturasFiltradas]);

  return (
    <div>
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Facturación e Ingresos</h1>
          <p className="subtitle">Reporte financiero y arqueo de caja</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Desde <input type="date" className="form-control" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Hasta <input type="date" className="form-control" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <button className={`btn btn-ghost btn-sm ${refreshing ? 'spinning' : ''}`} onClick={handleRefresh} disabled={refreshing} title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><DollarSign size={20} /></div>
            <span className="stat-trend flat">{facturasFiltradas.length} facturas</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{formatMoney(totalIngresos)}</div>
          <div className="stat-label">Total Facturado</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}><TrendingUp size={20} /></div>
            <span className="stat-trend flat">por factura</span>
          </div>
          <div className="stat-value">{formatMoney(ticketPromedio)}</div>
          <div className="stat-label">Ticket Promedio</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><CreditCard size={20} /></div>
            <span className="stat-trend flat">Métodos de pago</span>
          </div>
          <div style={{ fontSize: '0.9rem', marginTop: '0.4rem' }}>
            <div><Banknote size={14} /> Efectivo: <strong>{formatMoney(desgloseMetodos.efectivo)}</strong></div>
            <div><CreditCard size={14} /> Tarjeta: <strong>{formatMoney(desgloseMetodos.tarjeta)}</strong></div>
            <div><Receipt size={14} /> Transferencia: <strong>{formatMoney(desgloseMetodos.transferencia)}</strong></div>
          </div>
          <div className="stat-label" style={{ marginTop: '0.4rem' }}>Desglose de Cobros</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="h-icon"><Receipt size={18} /> Facturas Emitidas</h3>
        </div>
        <div className="card-body table-container">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando facturas de FastAPI...</p>
          ) : facturasFiltradas.length === 0 ? (
            <EmptyState icon={<Banknote size={24} />} title="Sin facturas en este rango" description="Registra un cobro o selecciona otro rango de fechas." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Factura</th>
                  <th>Comanda</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Subtotal</th>
                  <th>IVA (16%)</th>
                  <th>Total</th>
                  <th>Ticket</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((factura) => (
                  <tr key={factura.id_factura}>
                    <td><strong>{factura.numero_factura}</strong></td>
                    <td>#{factura.id_orden}</td>
                    <td>{formatDateTime(factura.fecha_emision)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{factura.metodo_pago}</td>
                    <td>{formatMoney(factura.subtotal)}</td>
                    <td>{formatMoney(factura.impuesto)}</td>
                    <td><strong style={{ color: 'var(--success)' }}>{formatMoney(factura.total)}</strong></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedInvoice(factura)}>
                        <Printer size={14} /> Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedInvoice && <InvoicePrintModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
}
