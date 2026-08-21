import { ReceiptText, Search, X } from 'lucide-react';
import { useState } from 'react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';

export default function Cajero() {
  const [paymentOpen, setPaymentOpen] = useState(false);

  return (
    <>
      <PageIntro eyebrow="Caja · Cierre" title="Cobro y facturación" description="Revisión de órdenes listas o servidas, método de pago y ticket." />

      <div className="cashier-kpis">
        <div><span>Por cobrar</span><strong>—</strong><small>órdenes reales</small></div>
        <div><span>Facturas del día</span><strong>—</strong><small>datos pendientes de API</small></div>
        <div><span>Total cobrado</span><strong>—</strong><small>sin movimientos ficticios</small></div>
      </div>

      <section className="panel cash-orders-panel">
        <div className="panel-head">
          <div><h3>Órdenes disponibles</h3><p>Estados esperados: ready / served.</p></div>
          <div className="cash-search"><Search size={16} /><span>Buscar orden</span></div>
        </div>
        <div className="cash-state-tabs"><button className="active">Lista</button><button>Servida</button><button>Pagada</button></div>
        <EmptyPanel title="Sin órdenes para cobrar" text="Las cuentas reales aparecerán aquí cuando el backend entregue órdenes listas o servidas." />
      </section>

      {paymentOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="payment-modal">
            <button className="modal-close" onClick={() => setPaymentOpen(false)} aria-label="Cerrar"><X size={18} /></button>
            <ReceiptText size={28} className="modal-icon" />
            <span className="panel-kicker">Confirmación</span>
            <h3>Registrar pago</h3>
            <p>El modal está construido visualmente. No procesa pagos hasta conectar la API.</p>
            <button className="primary-btn full" onClick={() => setPaymentOpen(false)}>Cerrar vista previa</button>
          </div>
        </div>
      )}
    </>
  );
}
