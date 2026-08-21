import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, FileText, ReceiptText, Search, Wallet, Store, UserRound, Clock3,
  Lock, LockOpen, ArrowDownToLine, ArrowUpFromLine, StickyNote,
} from 'lucide-react';
import PageIntro from '../../components/common/PageIntro.jsx';
import EmptyPanel from '../../components/common/EmptyPanel.jsx';
import { useToast } from '../../components/Toast';
import { useOrders } from '../../context/ordersCore';
import { cajaService } from '../../services/cajaService';
import { useAuth } from '../../context/AuthContext';
import { formatMoney } from '../../services/format';
import '../../styles/Orders.css';

const METODOS = [
  { key: 'efectivo', label: 'Efectivo', icon: Wallet },
  { key: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { key: 'transferencia', label: 'Transferencia', icon: FileText },
  { key: 'billetera_digital', label: 'Billetera digital', icon: Wallet },
];

export default function Cashier() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { orders, loading, refresh, payOrder } = useOrders();

  const [query, setQuery] = useState('');
  const [seleccionada, setSeleccionada] = useState(null);
  const [metodo, setMetodo] = useState('efectivo');
  const [referencia, setReferencia] = useState('');
  const [pagando, setPagando] = useState(false);

  const [sesion, setSesion] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [fondo, setFondo] = useState('');
  const [movModal, setMovModal] = useState(false);
  const [movForm, setMovForm] = useState({ tipo: 'ingreso', concepto: '', monto: '' });
  const [busy, setBusy] = useState(false);

  const userId = user?.id_usuario;

  const loadSesion = useCallback(async () => {
    if (!userId) return;
    try {
      const s = await cajaService.getSesion(userId);
      setSesion(s);
      if (s) {
        setMovimientos(await cajaService.getMovimientos(s.id_sesion));
      } else {
        setMovimientos([]);
      }
    } catch {
      setSesion(null);
    }
  }, [userId]);

  useEffect(() => {
    loadSesion();
  }, [loadSesion]);

  const porCobrar = useMemo(() => {
    const base = orders.filter((o) => o.estado === 'entregada');
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((o) => String(o.id).includes(q) || String(o.mesa).includes(q));
  }, [orders, query]);

  const totalSesion = useMemo(
    () => movimientos.reduce((s, m) => s + (m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)), 0),
    [movimientos],
  );

  const abrirSesion = async (e) => {
    e.preventDefault();
    if (fondo === '') return;
    setBusy(true);
    try {
      await cajaService.abrirSesion({ id_usuario: user.id_usuario, fondo_inicial: Number(fondo) });
      showToast('Caja abierta', 'success');
      setFondo('');
      loadSesion();
    } catch (err) {
      showToast(err.message || 'Error abriendo caja', 'urgent');
    } finally {
      setBusy(false);
    }
  };

  const cerrarSesion = async () => {
    if (!sesion) return;
    const contado = window.prompt('Efectivo contado al cierre:');
    if (contado === null) return;
    const esperado = Number(sesion.fondo_inicial) + totalSesion;
    try {
      await cajaService.cerrarSesion(sesion.id_sesion, {
        efectivo_contado: Number(contado) || 0,
        efectivo_esperado: esperado,
        diferencia: (Number(contado) || 0) - esperado,
        observaciones: '',
      });
      showToast('Caja cerrada', 'success');
      loadSesion();
    } catch (err) {
      showToast(err.message || 'Error cerrando caja', 'urgent');
    }
  };

  const registrarMov = async (e) => {
    e.preventDefault();
    if (!movForm.concepto.trim() || !movForm.monto) return;
    setBusy(true);
    try {
      await cajaService.crearMovimiento(sesion.id_sesion, {
        tipo: movForm.tipo,
        concepto: movForm.concepto.trim(),
        monto: Number(movForm.monto),
        creado_por: user.id_usuario,
      });
      showToast('Movimiento registrado', 'success');
      setMovModal(false);
      setMovForm({ tipo: 'ingreso', concepto: '', monto: '' });
      loadSesion();
    } catch (err) {
      showToast(err.message || 'Error registrando movimiento', 'urgent');
    } finally {
      setBusy(false);
    }
  };

  const pagar = async () => {
    if (!seleccionada) return;
    setPagando(true);
    try {
      await payOrder(seleccionada.id, metodo, referencia.trim());
      showToast(`Orden #${seleccionada.id} pagada · factura generada`, 'success');
      setSeleccionada(null);
      setReferencia('');
      refresh();
    } catch (err) {
      showToast(err.message || 'Error registrando el pago', 'urgent');
    } finally {
      setPagando(false);
    }
  };

  return <>
    <PageIntro eyebrow="Caja" title="Cobro y facturación" description="Cierre de cuentas, métodos de pago, sesión de caja y facturación." />

    <div className="checkout-layout">
      <section className="panel">
        <div className="panel-head">
          <div><h3>Órdenes listas para cobrar</h3>
            <p>{porCobrar.length} entregadas esperando pago{loading ? ' · cargando...' : ''}</p>
          </div>
          <Search size={20} />
        </div>
        <div className="toolbar">
          <label className="search-box">
            <Search size={17} />
            <input placeholder="Buscar orden o mesa..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
        {porCobrar.length === 0 ? (
          <EmptyPanel title="Sin órdenes para cobrar" text="Aquí aparecerán órdenes en estado entregada." />
        ) : (
          <div className="ord-list" style={{ gridTemplateColumns: '1fr' }}>
            {porCobrar.map((o) => (
              <motion.button
                key={o.id} type="button" className="ord-card" onClick={() => setSeleccionada(o)}
                style={{ cursor: 'pointer', textAlign: 'left', border: seleccionada?.id === o.id ? '1.5px solid var(--gold)' : undefined }}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="ord-card-top">
                  <span className="ord-id">Orden #{o.id}</span>
                  <span className="ord-status entregada">Entregada</span>
                  <div className="ord-meta">
                    <span><Store size={13} /> Mesa {o.mesa}</span>
                    <span><UserRound size={13} /> {o.mesero}</span>
                    <span><Clock3 size={13} /> {o.hora}</span>
                  </div>
                </div>
                <div className="ord-items">
                  {o.items.map((i) => (
                    <span className="ord-item-chip" key={i.id || i.nombre}><b>{i.cantidad}×</b> {i.nombre}</span>
                  ))}
                </div>
                {o.notas && <div className="ord-note"><StickyNote size={13} /> {o.notas}</div>}
                <div className="ord-card-bottom">
                  <div className="ord-total"><small>Total a cobrar</small>{formatMoney(o.total)}</div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <aside className="panel checkout-card">
        <div className="panel-head"><h3>Resumen de cobro</h3><ReceiptText size={20} /></div>
        <div className="payment-total">
          <span>Total</span>
          <strong>{seleccionada ? formatMoney(seleccionada.total) : '—'}</strong>
        </div>
        <div className="payment-methods">
          {METODOS.map(({ key, label, icon: Icon }) => (
            <button
              key={key} type="button"
              style={metodo === key ? { borderColor: 'var(--gold)', background: '#fbf0d1' } : undefined}
              onClick={() => setMetodo(key)}
            >
              <Icon size={19} /> {label}
            </button>
          ))}
        </div>
        {(metodo === 'transferencia' || metodo === 'billetera_digital') && (
          <input
            className="modal-input" style={{ marginBottom: 10 }} placeholder="Número de referencia"
            value={referencia} onChange={(e) => setReferencia(e.target.value)}
          />
        )}
        <button className="primary-btn full" onClick={pagar} disabled={!seleccionada || pagando}>
          {pagando ? 'Procesando...' : 'Registrar pago'}
        </button>

        <div className="panel-head" style={{ marginTop: 22 }}>
          <h3>Sesión de caja</h3>
          {sesion?.estado === 'abierta' ? <LockOpen size={18} color="#5a8a3c" /> : <Lock size={18} />}
        </div>
        {sesion && sesion.estado === 'abierta' ? (
          <div className="ord-activity">
            <div className="ord-activity-row"><strong>Fondo inicial</strong><span className="ord-total-inline">{formatMoney(Number(sesion.fondo_inicial))}</span></div>
            <div className="ord-activity-row"><strong>Movimientos</strong><span className="ord-total-inline">{formatMoney(totalSesion)}</span></div>
            <div className="ord-activity-row"><strong>Esperado en caja</strong><span className="ord-total-inline">{formatMoney(Number(sesion.fondo_inicial) + totalSesion)}</span></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="secondary-btn" onClick={() => setMovModal(true)}><ArrowDownToLine size={15} /> Movimiento</button>
              <button className="ghost-btn" onClick={cerrarSesion}><ArrowUpFromLine size={15} /> Cerrar caja</button>
            </div>
          </div>
        ) : (
          <form onSubmit={abrirSesion} className="ord-activity" style={{ gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>No hay sesión de caja abierta para ti.</span>
            <label className="tm-field">
              Fondo inicial (COP)
              <input
                className="modal-input" type="number" min="0" value={fondo}
                onChange={(e) => setFondo(e.target.value)} placeholder="Ej. 50000" required
              />
            </label>
            <button className="secondary-btn full" type="submit" disabled={busy}>
              <LockOpen size={15} /> {busy ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </form>
        )}
      </aside>
    </div>

    {movModal && sesion && (
      <>
        <div className="modal-overlay" onClick={() => setMovModal(false)} />
        <div className="modal-container">
          <div className="modal-header">
            <h2><Wallet size={20} /> Movimiento de caja</h2>
          </div>
          <form className="modal-body" onSubmit={registrarMov}>
            <label className="modal-label">Tipo
              <select className="modal-input" value={movForm.tipo}
                onChange={(e) => setMovForm({ ...movForm, tipo: e.target.value })}>
                <option value="ingreso">Ingreso de efectivo</option>
                <option value="retiro">Retiro de efectivo</option>
              </select>
            </label>
            <label className="modal-label">Concepto
              <input className="modal-input" required value={movForm.concepto}
                onChange={(e) => setMovForm({ ...movForm, concepto: e.target.value })}
                placeholder="Ej. Pago de proveedor, propina" />
            </label>
            <label className="modal-label">Monto (COP)
              <input className="modal-input" type="number" min="0" required value={movForm.monto}
                onChange={(e) => setMovForm({ ...movForm, monto: e.target.value })} />
            </label>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setMovModal(false)}>Cancelar</button>
              <button type="submit" className="secondary-btn" disabled={busy}>{busy ? 'Registrando...' : 'Registrar'}</button>
            </div>
          </form>
        </div>
      </>
    )}
  </>;
}
