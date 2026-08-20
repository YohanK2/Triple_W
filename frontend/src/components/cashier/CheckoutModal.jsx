import { useState } from 'react';
import { Banknote, Check, CreditCard, Loader2, QrCode } from 'lucide-react';
import { facturasService, mesasService, ordenesService } from '../../services';
import { formatMoney } from '../../services/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import Modal from '../Modal';

function generarNumeroFactura(idOrden) {
  const year = new Date().getFullYear();
  return `FAC-${year}-${String(idOrden).padStart(5, '0')}`;
}

export default function CheckoutModal({ order, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [efectivoRecibido, setEfectivoRecibido] = useState('');
  const [numeroReferencia, setNumeroReferencia] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalPagar = Number(order?.total) || 0;
  const montoEntregado = Number.parseFloat(efectivoRecibido) || 0;
  const cambio = Math.max(0, montoEntregado - totalPagar);

  async function liberarMesa() {
    const estados = await mesasService.getEstados();
    const estadoMesa = estados.find((estado) => estado.id_mesa === order.id_mesa);
    if (!estadoMesa) return false;

    await mesasService.updateEstadoMesa(estadoMesa.id_estado, {
      ...estadoMesa,
      estado: 'libre',
      actualizado_por: user?.id_usuario || 1,
    });
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (metodoPago === 'efectivo' && montoEntregado < totalPagar) {
      showToast('El efectivo recibido es menor al total a pagar', 'urgent');
      return;
    }

    if ((metodoPago === 'tarjeta' || metodoPago === 'transferencia') && !numeroReferencia.trim()) {
      showToast('Ingresa la referencia del pago', 'urgent');
      return;
    }

    setSubmitting(true);
    try {
      const facturaData = {
        id_orden: order.id_orden,
        numero_factura: generarNumeroFactura(order.id_orden),
        subtotal: Number(order.subtotal) || 0,
        impuesto: Number(order.impuesto) || 0,
        total: totalPagar,
        metodo_pago: metodoPago,
        numero_referencia: metodoPago === 'efectivo'
          ? `EFECTIVO-RECIBIDO:${montoEntregado.toFixed(2)}|CAMBIO:${cambio.toFixed(2)}`
          : numeroReferencia.trim(),
        creado_por: user?.id_usuario || 1,
      };

      const facturaResult = await facturasService.createFactura(facturaData);
      await ordenesService.updateOrden(order.id_orden, {
        id_orden: order.id_orden,
        id_cliente: order.id_cliente ?? null,
        id_mesa: order.id_mesa,
        id_mesero: order.id_mesero,
        subtotal: facturaData.subtotal,
        impuesto: facturaData.impuesto,
        total: facturaData.total,
        estado: 'pagado',
        notas: order.notas || null,
      });

      let mesaLiberada = false;
      try {
        mesaLiberada = await liberarMesa();
      } catch (mesaError) {
        console.warn('No se pudo liberar la mesa:', mesaError);
        showToast('Pago registrado, pero la mesa debe liberarse manualmente', 'urgent');
      }

      const invoice = {
        ...facturaData,
        id_factura: facturaResult?.id_factura,
        fecha_emision: new Date().toISOString(),
        cambio,
        mesaLiberada,
        orden: order,
      };
      showToast(`Factura ${facturaData.numero_factura} generada`, 'success', `Mesa #${order.id_mesa}`);
      onSuccess?.(invoice);
      onClose();
    } catch (error) {
      showToast(error.message || 'Error al procesar el cobro', 'urgent');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={`Cobrar Comanda #${order.id_orden}`} onClose={onClose} maxWidth={560}>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <div
          style={{
            background: 'var(--success-soft, rgba(16, 185, 129, 0.1))',
            border: '1px solid var(--success, #10b981)',
            borderRadius: 10,
            padding: '1.25rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total a Liquidar · Mesa #{order.id_mesa || 'Barra'}
          </span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success, #10b981)', marginTop: '0.2rem' }}>
            {formatMoney(totalPagar)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Subtotal: {formatMoney(order.subtotal)} + IVA (16%): {formatMoney(order.impuesto)}
          </div>
        </div>

        <div className="form-group">
          <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Método de Pago</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              ['efectivo', <Banknote size={22} />, 'Efectivo'],
              ['tarjeta', <CreditCard size={22} />, 'Tarjeta'],
              ['transferencia', <QrCode size={22} />, 'Transferencia'],
            ].map(([method, icon, label]) => (
              <button
                key={method}
                type="button"
                className={`btn ${metodoPago === method ? 'btn-primary' : 'btn-ghost'}`}
                style={{ minHeight: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                onClick={() => setMetodoPago(method)}
              >
                {icon}
                <span style={{ fontSize: '0.85rem' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {metodoPago === 'efectivo' ? (
          <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '1rem', borderRadius: 8, margin: '1rem 0' }}>
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Efectivo Recibido (COP)</label>
              <input
                type="number"
                step="0.01"
                min={totalPagar}
                className="form-control"
                value={efectivoRecibido}
                onChange={(event) => setEfectivoRecibido(event.target.value)}
                placeholder={`Ej. ${Math.ceil(totalPagar / 100) * 100}`}
                required
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.6rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Cambio a Devolver:</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>{formatMoney(cambio)}</strong>
            </div>
          </div>
        ) : (
          <div className="form-group" style={{ margin: '1rem 0' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Referencia del Pago</label>
            <input
              type="text"
              className="form-control"
              value={numeroReferencia}
              onChange={(event) => setNumeroReferencia(event.target.value)}
              placeholder="Ej. AUTH-894102"
              required
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button
            type="submit"
            className="btn btn-success"
            disabled={submitting || (metodoPago === 'efectivo' && montoEntregado < totalPagar)}
            style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {submitting ? <><Loader2 size={18} className="animate-spin" /> Registrando pago...</> : <><Check size={18} /> Confirmar Pago y Facturar</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
