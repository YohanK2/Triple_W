import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Receipt, Search, DollarSign, BarChart3, Zap } from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import StatCard from '../../components/common/StatCard.jsx';
import { useToast } from '../../components/Toast';
import { facturasService } from '../../services/facturasService';
import { dashboardService } from '../../services/dashboardService';
import { formatMoney, formatDateTime } from '../../services/format';

const METODOS = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  billetera_digital: 'Billetera digital',
};

export default function Sales() {
  const { showToast } = useToast();
  const [facturas, setFacturas] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [query, setQuery] = useState('');
  const [metodo, setMetodo] = useState('todos');

  const load = useCallback(async () => {
    try {
      const [f, r] = await Promise.all([facturasService.getFacturas(), dashboardService.getResumen()]);
      setFacturas(f);
      setResumen(r);
    } catch (e) {
      setFacturas([]);
      showToast(e.message || 'Error cargando ventas', 'urgent');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtradas = useMemo(() => {
    if (!facturas) return [];
    const q = query.trim().toLowerCase();
    return facturas
      .filter((f) => metodo === 'todos' || f.metodo_pago === metodo)
      .filter((f) => !q || String(f.numero_factura).toLowerCase().includes(q)
        || String(f.id_orden).includes(q));
  }, [facturas, query, metodo]);

  const totalFacturado = useMemo(
    () => filtradas.reduce((s, f) => s + Number(f.total), 0),
    [filtradas],
  );

  const exportCSV = () => {
    if (!filtradas.length) return;
    const header = 'Factura,Orden,Subtotal,Impuesto,Total,Metodo,Fecha\n';
    const rows = filtradas.map((f) => [
      f.numero_factura, f.id_orden, f.subtotal, f.impuesto, f.total,
      METODOS[f.metodo_pago] || f.metodo_pago, f.fecha_emision,
    ].join(',')).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('CSV de ventas exportado', 'success');
  };

  return <>
    <PageIntro
      eyebrow="Administración"
      title="Ventas"
      description="Consulta y seguimiento de facturas emitidas y ventas registradas."
      action={<button className="primary-btn" onClick={exportCSV} disabled={!filtradas.length}><Download size={17}/> Exportar</button>}
    />

    <div className="stats-grid">
      <StatCard icon={DollarSign} label="Ventas hoy" value={resumen ? formatMoney(resumen.ventas_hoy) : '—'} />
      <StatCard icon={BarChart3} label="Ventas del mes" value={resumen ? formatMoney(resumen.ventas_mes) : '—'} />
      <StatCard icon={Zap} label="Facturas del mes" value={resumen ? resumen.facturas_mes : '—'} />
      <StatCard icon={Receipt} label="Total filtrado" value={formatMoney(totalFacturado)} hint={`${filtradas.length} facturas`} />
    </div>

    <section className="panel">
      <div className="toolbar">
        <label className="search-box">
          <Search size={17}/>
          <input placeholder="Buscar factura u orden..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="category-tabs" style={{ marginBottom: 0 }}>
          <button className={metodo === 'todos' ? 'active' : ''} onClick={() => setMetodo('todos')}>Todos</button>
          {Object.entries(METODOS).map(([k, label]) => (
            <button key={k} className={metodo === k ? 'active' : ''} onClick={() => setMetodo(k)}>{label}</button>
          ))}
        </div>
      </div>
      {facturas === null ? (
        <EmptyPanel title="Cargando facturas..." text="Consultando /facturas." />
      ) : filtradas.length === 0 ? (
        <EmptyPanel title="Sin ventas cargadas" text="Las facturas aparecerán cuando se registren pagos en caja." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Factura</th><th>Orden</th><th>Subtotal</th><th>Impuesto</th><th>Total</th><th>Método</th><th>Fecha</th></tr>
            </thead>
            <tbody>
              {filtradas.map((f) => (
                <tr key={f.id_factura}>
                  <td><strong>{f.numero_factura}</strong></td>
                  <td>#{f.id_orden}</td>
                  <td>{formatMoney(Number(f.subtotal))}</td>
                  <td>{formatMoney(Number(f.impuesto))}</td>
                  <td><strong>{formatMoney(Number(f.total))}</strong></td>
                  <td><span className="category-product-count">{METODOS[f.metodo_pago] || f.metodo_pago}</span></td>
                  <td>{formatDateTime(f.fecha_emision)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  </>;
}
