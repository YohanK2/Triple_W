import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  Ban,
  CalendarDays,
  Check,
  CheckCircle2,
  CreditCard,
  Clock3,
  LogOut,
  MapPin,
  Printer,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Table2,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cajaService, facturasService, ordenesService, reservasService } from '../services';
import { formatDateTime, formatMoney, timeAgo } from '../services/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import CheckoutModal from '../components/cashier/CheckoutModal';
import InvoicePrintModal from '../components/cashier/InvoicePrintModal';
import '../assets/styles/cajero.css';


const RESERVATION_STATUSES = [
  ['all', 'Todas'],
  ['pendiente', 'Pendientes'],
  ['confirmada', 'Confirmadas'],
  ['completada', 'Completadas'],
  ['cancelada', 'Canceladas'],
];

const STATUS_LABELS = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const TABLE_STATUS_LABELS = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  mantenimiento: 'Mantenimiento',
};

function localDateTimeInput() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatReservationDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('es-MX', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function dateKey(value) {
  return String(value || '').slice(0, 10);
}

function emptyForm() {
  return {
    id_cliente: '',
    id_mesa: '',
    fecha_reserva: localDateTimeInput(),
    tamano_grupo: '2',
    notas: '',
  };
}

function CashierPaymentsView({ orders, onPay }) {
  return (
    <section className="cashier-workspace">
      <div className="cashier-workspace-heading">
        <div><p className="cashier-eyebrow">Caja abierta</p><h2>Comandas listas para cobrar</h2><p>Solo aparecen las órdenes que ya fueron servidas al cliente.</p></div>
        <span className="cashier-count">{orders.length} pendientes</span>
      </div>
      {orders.length === 0 ? (
        <EmptyState icon={<Banknote size={26} />} title="No hay cobros pendientes" description="Las comandas aparecerán aquí después de ser servidas." />
      ) : (
        <div className="cashier-payment-grid">
          {orders.map((order) => (
            <article className="cashier-payment-card" key={order.id_orden}>
              <div className="payment-card-top"><span className="payment-order">Comanda #{order.id_orden}</span><span className="payment-status">SERVIDA</span></div>
              <div className="payment-card-main"><div><span className="payment-table">Mesa #{order.id_mesa || 'Barra'}</span><span className="payment-mesero">Mesero #{order.id_mesero}</span></div><strong>{formatMoney(order.total)}</strong></div>
              <div className="payment-card-meta"><span>{timeAgo(order.creado_en)}</span><span>IVA {formatMoney(order.impuesto)}</span></div>
              <button className="cashier-primary-button payment-button" onClick={() => onPay(order)}><Banknote size={17} /> Cobrar cuenta</button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function CashierInvoicesView({ invoices, onPrint }) {
  const total = invoices.reduce((sum, invoice) => sum + (Number(invoice.total) || 0), 0);
  return (
    <section className="cashier-workspace">
      <div className="cashier-workspace-heading">
        <div><p className="cashier-eyebrow">Historial persistido</p><h2>Facturas emitidas</h2><p>Comprobantes registrados directamente en FastAPI.</p></div>
        <div className="cashier-invoice-total"><span>Total facturado</span><strong>{formatMoney(total)}</strong></div>
      </div>
      {invoices.length === 0 ? <EmptyState icon={<Receipt size={26} />} title="No hay facturas registradas" description="Los cobros confirmados aparecerán aquí." /> : (
        <div className="cashier-invoice-table-wrap">
          <table className="cashier-invoice-table">
            <thead><tr><th>Factura</th><th>Comanda</th><th>Fecha</th><th>Método</th><th>Total</th><th /></tr></thead>
            <tbody>{invoices.map((invoice) => <tr key={invoice.id_factura}>
              <td><strong>{invoice.numero_factura}</strong></td>
              <td>#{invoice.id_orden}</td>
              <td>{formatDateTime(invoice.fecha_emision)}</td>
              <td><span className="payment-method"><WalletCards size={14} /> {invoice.metodo_pago}</span></td>
              <td><strong>{formatMoney(invoice.total)}</strong></td>
              <td><button className="cashier-ticket-button" onClick={() => onPrint(invoice)}><Printer size={15} /> Ticket</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function CashierCloseView({ invoices, cashSession, movements, openingAmount, closingAmount, setOpeningAmount, setClosingAmount, onOpen, onClose, onMovement }) {
  const [movementType, setMovementType] = useState('ingreso');
  const [movementConcept, setMovementConcept] = useState('');
  const [movementAmount, setMovementAmount] = useState('');
  const sessionInvoices = cashSession?.estado === 'abierta'
    ? invoices.filter((invoice) => new Date(invoice.fecha_emision) >= new Date(cashSession.fecha_apertura))
    : [];
  const cashSales = sessionInvoices.filter((invoice) => invoice.metodo_pago === 'efectivo').reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const cardSales = sessionInvoices.filter((invoice) => invoice.metodo_pago === 'tarjeta').reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const transferSales = sessionInvoices.filter((invoice) => invoice.metodo_pago === 'transferencia').reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const manualIncome = movements.filter((movement) => movement.tipo === 'ingreso').reduce((sum, movement) => sum + Number(movement.monto || 0), 0);
  const manualWithdrawals = movements.filter((movement) => movement.tipo === 'retiro').reduce((sum, movement) => sum + Number(movement.monto || 0), 0);
  const expectedCash = Number(cashSession?.fondo_inicial || 0) + cashSales + manualIncome - manualWithdrawals;
  const difference = closingAmount === '' ? null : Number(closingAmount || 0) - expectedCash;

  async function handleMovement(event) {
    event.preventDefault();
    if (!movementConcept.trim() || Number(movementAmount) <= 0) return;
    await onMovement({ tipo: movementType, concepto: movementConcept.trim(), monto: Number(movementAmount) });
    setMovementConcept('');
    setMovementAmount('');
  }

  return (
    <section className="cashier-workspace close-workspace">
      <div className="cashier-workspace-heading"><div><p className="cashier-eyebrow">Control de efectivo</p><h2>Cierre y arqueo de caja</h2><p>El resumen se calcula con las facturas del periodo de esta sesión.</p></div><span className={`cash-session-badge ${cashSession?.estado === 'abierta' ? 'open' : 'closed'}`}>{cashSession?.estado === 'abierta' ? 'Caja abierta' : 'Caja cerrada'}</span></div>
      {!cashSession || cashSession.estado !== 'abierta' ? (
        <div className="cash-open-card"><div className="cash-open-icon"><Banknote size={25} /></div><div><h3>Abrir sesión de caja</h3><p>Registra el fondo inicial para comenzar el arqueo del turno.</p></div><div className="cash-open-form"><label>Fondo inicial<input type="number" min="0" step="0.01" value={openingAmount} onChange={(event) => setOpeningAmount(event.target.value)} /></label><button className="cashier-primary-button" onClick={onOpen}>Abrir caja</button></div></div>
      ) : (
        <>
          <div className="cash-session-summary"><div><span>Inicio de sesión</span><strong>{formatDateTime(cashSession.fecha_apertura)}</strong></div><div><span>Fondo inicial</span><strong>{formatMoney(cashSession.fondo_inicial)}</strong></div><div><span>Facturas del turno</span><strong>{sessionInvoices.length}</strong></div></div>
          <div className="cash-reconciliation-grid"><div><span><Banknote size={16} /> Efectivo</span><strong>{formatMoney(cashSales)}</strong></div><div><span><CreditCard size={16} /> Tarjeta</span><strong>{formatMoney(cardSales)}</strong></div><div><span><WalletCards size={16} /> Transferencia</span><strong>{formatMoney(transferSales)}</strong></div><div className="cash-expected"><span>Efectivo esperado</span><strong>{formatMoney(expectedCash)}</strong></div></div>
          <form className="cash-movement-form" onSubmit={handleMovement}><strong>Ajuste de caja</strong><select value={movementType} onChange={(event) => setMovementType(event.target.value)}><option value="ingreso">Ingreso</option><option value="retiro">Retiro</option></select><input value={movementConcept} onChange={(event) => setMovementConcept(event.target.value)} placeholder="Concepto" /><input type="number" min="0.01" step="0.01" value={movementAmount} onChange={(event) => setMovementAmount(event.target.value)} placeholder="Monto" /><button className="cashier-secondary-button" type="submit">Registrar</button></form>
          {movements.length > 0 && <div className="cash-movement-list">{movements.map((movement) => <div key={movement.id_movimiento}><span className={movement.tipo === 'ingreso' ? 'movement-income' : 'movement-withdrawal'}>{movement.tipo === 'ingreso' ? '+' : '-'} {formatMoney(movement.monto)}</span><span>{movement.concepto}</span><small>{formatDateTime(movement.creado_en)}</small></div>)}</div>}
          <div className="cash-close-form"><label>Efectivo contado al cierre<input type="number" min="0" step="0.01" value={closingAmount} onChange={(event) => setClosingAmount(event.target.value)} placeholder="0.00" /></label>{difference !== null && <div className={`cash-difference ${difference === 0 ? 'balanced' : difference > 0 ? 'surplus' : 'shortage'}`}><span>Diferencia</span><strong>{difference >= 0 ? '+' : ''}{formatMoney(difference)}</strong></div>}<button className="cashier-primary-button" onClick={() => onClose({ efectivo_contado: Number(closingAmount), efectivo_esperado: expectedCash, diferencia: difference })} disabled={closingAmount === ''}>Cerrar caja</button></div>
        </>
      )}
    </section>
  );
}

export default function Cajero() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [estadosMesas, setEstadosMesas] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('cobros');
  const [payOrder, setPayOrder] = useState(null);
  const [printedInvoice, setPrintedInvoice] = useState(null);
  const [cashSession, setCashSession] = useState(null);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');

  const loadData = useCallback(async () => {
    const [reservasRes, clientesRes, mesasRes, estadosRes, ordersRes, invoicesRes, cashSessionRes] = await Promise.allSettled([
      reservasService.getReservas(),
      reservasService.getClientes(),
      reservasService.getMesas(),
      reservasService.getEstadosMesas(),
      ordenesService.getOrdenes(),
      facturasService.getFacturas(),
      cajaService.getSesion(user?.id_usuario || 1),
    ]);

    setReservas(reservasRes.status === 'fulfilled' && Array.isArray(reservasRes.value) ? reservasRes.value : []);
    setClientes(clientesRes.status === 'fulfilled' && Array.isArray(clientesRes.value) ? clientesRes.value : []);
    setMesas(mesasRes.status === 'fulfilled' && Array.isArray(mesasRes.value) ? mesasRes.value : []);
    setEstadosMesas(estadosRes.status === 'fulfilled' && Array.isArray(estadosRes.value) ? estadosRes.value : []);
    setOrders(ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value) ? ordersRes.value : []);
    setInvoices(invoicesRes.status === 'fulfilled' && Array.isArray(invoicesRes.value) ? invoicesRes.value : []);
    setCashSession(cashSessionRes.status === 'fulfilled' ? cashSessionRes.value : null);
    setLoading(false);
  }, [user?.id_usuario]);

  const payableOrders = useMemo(
    () => {
      const invoicedOrders = new Set(invoices.map((invoice) => invoice.id_orden));
      return orders
        .filter((order) => order.estado === 'servido' && !invoicedOrders.has(order.id_orden))
        .sort((a, b) => (b.id_orden || 0) - (a.id_orden || 0));
    },
    [invoices, orders]
  );

  useEffect(() => {
    const initialLoad = setTimeout(loadData, 0);
    const interval = setInterval(loadData, 30000);
    return () => {
      clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [loadData]);

  useEffect(() => {
    if (!cashSession?.id_sesion) {
      const reset = setTimeout(() => setMovements([]), 0);
      return () => clearTimeout(reset);
    }
    let mounted = true;
    cajaService.getMovimientos(cashSession.id_sesion).then((data) => {
      if (mounted) setMovements(Array.isArray(data) ? data : []);
    }).catch(() => {
      if (mounted) setMovements([]);
    });
    return () => {
      mounted = false;
    };
  }, [cashSession?.id_sesion]);

  const clientsById = useMemo(() => new Map(clientes.map((client) => [client.id_cliente, client])), [clientes]);
  const tablesById = useMemo(() => new Map(mesas.map((table) => [table.id_mesa, table])), [mesas]);
  const tableStatesById = useMemo(() => new Map(estadosMesas.map((state) => [state.id_mesa, state])), [estadosMesas]);

  const enrichedReservations = useMemo(() => reservas.map((reservation) => ({
    ...reservation,
    cliente: clientsById.get(reservation.id_cliente),
    mesa: tablesById.get(reservation.id_mesa),
    mesaEstado: tableStatesById.get(reservation.id_mesa),
  })).sort((a, b) => new Date(a.fecha_reserva) - new Date(b.fecha_reserva)), [reservas, clientsById, tablesById, tableStatesById]);

  const filteredReservations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return enrichedReservations.filter((reservation) => {
      const client = reservation.cliente;
      const matchesStatus = statusFilter === 'all' || reservation.estado === statusFilter;
      const matchesDate = dateFilter === 'all' || dateKey(reservation.fecha_reserva) === dateFilter;
      const searchable = [
        client?.nombre,
        client?.telefono,
        reservation.mesa?.numero_mesa,
        reservation.notas,
      ].join(' ').toLowerCase();
      return matchesStatus && matchesDate && (!needle || searchable.includes(needle));
    });
  }, [dateFilter, enrichedReservations, search, statusFilter]);

  const metrics = useMemo(() => ({
    total: enrichedReservations.length,
    pending: enrichedReservations.filter((reservation) => reservation.estado === 'pendiente').length,
    confirmed: enrichedReservations.filter((reservation) => reservation.estado === 'confirmada').length,
    freeTables: estadosMesas.filter((state) => state.estado === 'libre').length,
  }), [enrichedReservations, estadosMesas]);

  function openCreateModal() {
    setEditingReservation(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEditModal(reservation) {
    setEditingReservation(reservation);
    setForm({
      id_cliente: String(reservation.id_cliente || ''),
      id_mesa: String(reservation.id_mesa || ''),
      fecha_reserva: String(reservation.fecha_reserva || '').slice(0, 16),
      tamano_grupo: String(reservation.tamano_grupo || 2),
      notas: reservation.notas || '',
    });
    setModalOpen(true);
  }

  async function saveReservation(event) {
    event.preventDefault();
    if (!form.id_cliente || !form.id_mesa || !form.fecha_reserva) {
      showToast('Completa cliente, mesa y fecha de la reserva', 'urgent');
      return;
    }

    setSaving(true);
    const payload = {
      id_cliente: Number(form.id_cliente),
      id_mesa: Number(form.id_mesa),
      fecha_reserva: form.fecha_reserva,
      tamano_grupo: Number(form.tamano_grupo) || 1,
      estado: editingReservation?.estado || 'pendiente',
      notas: form.notas.trim() || null,
      creado_por: editingReservation?.creado_por || user?.id_usuario || 1,
      actualizado_por: user?.id_usuario || 1,
    };

    try {
      if (editingReservation) {
        await reservasService.updateReserva(editingReservation.id_reserva, payload);
        showToast('Reserva actualizada', 'success');
      } else {
        await reservasService.createReserva(payload);
        showToast('Reserva creada', 'success');
      }
      setModalOpen(false);
      await loadData();
    } catch (error) {
      showToast(error.message || 'No se pudo guardar la reserva', 'urgent');
    } finally {
      setSaving(false);
    }
  }

  async function updateReservationStatus(reservation, estado) {
    try {
      await reservasService.updateReserva(reservation.id_reserva, {
        id_cliente: reservation.id_cliente,
        id_mesa: reservation.id_mesa,
        fecha_reserva: reservation.fecha_reserva,
        tamano_grupo: reservation.tamano_grupo,
        estado,
        notas: reservation.notas || null,
        creado_por: reservation.creado_por || user?.id_usuario || 1,
        actualizado_por: user?.id_usuario || 1,
      });
      showToast(`Reserva ${STATUS_LABELS[estado].toLowerCase()}`, 'success');
      await loadData();
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar la reserva', 'urgent');
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function openCashSession() {
    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      showToast('Ingresa un fondo inicial válido', 'urgent');
      return;
    }
    try {
      const session = await cajaService.abrirSesion({ id_usuario: user?.id_usuario || 1, fondo_inicial: amount });
      setCashSession(session);
      setOpeningAmount('');
      showToast('Caja abierta correctamente', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo abrir la caja', 'urgent');
    }
  }

  async function closeCashSession(cierre) {
    if (!cashSession || closingAmount === '') return;
    try {
      const session = await cajaService.cerrarSesion(cashSession.id_sesion, cierre);
      setCashSession(session);
      setClosingAmount('');
      showToast('Caja cerrada y arqueo registrado', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo cerrar la caja', 'urgent');
    }
  }

  async function createCashMovement(movement) {
    if (!cashSession?.id_sesion) return;
    try {
      const created = await cajaService.crearMovimiento(cashSession.id_sesion, {
        ...movement,
        creado_por: user?.id_usuario || 1,
      });
      setMovements((current) => [created, ...current]);
      showToast('Movimiento registrado', 'success');
    } catch (error) {
      showToast(error.message || 'No se pudo registrar el movimiento', 'urgent');
    }
  }

  function handlePaymentSuccess(invoice) {
    setPayOrder(null);
    setPrintedInvoice(invoice);
    loadData();
  }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="cashier-shell">
      <header className="cashier-topbar">
        <div className="cashier-brand">
          <div className="cashier-brand-mark"><CalendarDays size={23} /></div>
          <div>
            <strong>Mesa & Caja</strong>
            <span>Reservas y atención</span>
          </div>
        </div>
        <div className="cashier-topbar-actions">
          <span className="cashier-live"><span /> Operación en vivo</span>
          <div className="cashier-user">
            <span className="cashier-avatar">{(user?.nombres || user?.nombre_usuario || 'C').charAt(0).toUpperCase()}</span>
            <span>{user?.nombres || user?.nombre_usuario || 'Cajero'}</span>
          </div>
          <button className="cashier-icon-button" onClick={handleLogout} title="Cerrar sesión"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="cashier-content">
        <section className="cashier-hero">
          <div>
            <p className="cashier-eyebrow">Puesto de caja</p>
            <h1>{activeSection === 'cobros' ? 'Cobros del salón' : activeSection === 'facturas' ? 'Facturas y tickets' : activeSection === 'cierre' ? 'Cierre de caja' : 'Agenda de reservas'}</h1>
            <p>{activeSection === 'cobros' ? 'Cobra las comandas después de que hayan sido servidas.' : activeSection === 'facturas' ? 'Consulta comprobantes y vuelve a imprimir tickets.' : activeSection === 'cierre' ? 'Controla el efectivo esperado y realiza el arqueo del turno.' : 'Confirma llegadas, organiza mesas y mantén el salón listo para recibir.'}</p>
          </div>
          {activeSection === 'reservas' && <button className="cashier-primary-button" onClick={openCreateModal}><Plus size={18} /> Nueva reserva</button>}
        </section>

        <nav className="cashier-module-nav" aria-label="Módulos de caja">
          <button className={activeSection === 'cobros' ? 'active' : ''} onClick={() => setActiveSection('cobros')}><Banknote size={17} /> Cobros <span>{payableOrders.length}</span></button>
          <button className={activeSection === 'reservas' ? 'active' : ''} onClick={() => setActiveSection('reservas')}><CalendarDays size={17} /> Reservas</button>
          <button className={activeSection === 'facturas' ? 'active' : ''} onClick={() => setActiveSection('facturas')}><Receipt size={17} /> Facturas <span>{invoices.length}</span></button>
          <button className={activeSection === 'cierre' ? 'active' : ''} onClick={() => setActiveSection('cierre')}><WalletCards size={17} /> Cierre de caja</button>
        </nav>

        {activeSection === 'cobros' && <CashierPaymentsView orders={payableOrders} onPay={setPayOrder} />}
        {activeSection === 'facturas' && <CashierInvoicesView invoices={[...invoices].sort((a, b) => (b.id_factura || 0) - (a.id_factura || 0))} onPrint={setPrintedInvoice} />}
        {activeSection === 'cierre' && <CashierCloseView invoices={invoices} cashSession={cashSession} movements={movements} openingAmount={openingAmount} closingAmount={closingAmount} setOpeningAmount={setOpeningAmount} setClosingAmount={setClosingAmount} onOpen={openCashSession} onClose={closeCashSession} onMovement={createCashMovement} />}

        {activeSection === 'reservas' && (<>
        <section className="cashier-metrics" aria-label="Resumen de reservas">
          <div className="cashier-metric-card metric-dark"><span className="metric-icon"><CalendarDays size={19} /></span><strong>{metrics.total}</strong><span>Reservas registradas</span></div>
          <div className="cashier-metric-card"><span className="metric-icon"><Clock3 size={19} /></span><strong>{metrics.pending}</strong><span>Por confirmar</span></div>
          <div className="cashier-metric-card"><span className="metric-icon"><CheckCircle2 size={19} /></span><strong>{metrics.confirmed}</strong><span>Confirmadas</span></div>
          <div className="cashier-metric-card"><span className="metric-icon"><Table2 size={19} /></span><strong>{metrics.freeTables}</strong><span>Mesas libres</span></div>
        </section>

        <section className="cashier-toolbar">
          <div className="cashier-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, teléfono o mesa..." /></div>
          <div className="cashier-filter-group">
            <button className={dateFilter === 'all' ? 'active' : ''} onClick={() => setDateFilter('all')}>Todas las fechas</button>
            <input type="date" value={dateFilter === 'all' ? '' : dateFilter} onChange={(event) => setDateFilter(event.target.value || 'all')} aria-label="Filtrar por fecha" />
          </div>
          <button className="cashier-refresh-button" onClick={handleRefresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'cashier-spin' : ''} /> Actualizar</button>
        </section>

        <div className="cashier-status-tabs">
          {RESERVATION_STATUSES.map(([value, label]) => (
            <button key={value} className={statusFilter === value ? 'active' : ''} onClick={() => setStatusFilter(value)}>{label}</button>
          ))}
        </div>

        <div className="cashier-layout-grid">
          <section className="cashier-panel reservation-panel">
            <div className="cashier-panel-heading">
              <div><p className="cashier-eyebrow">Agenda operativa</p><h2>Reservas</h2></div>
              <span className="cashier-count">{filteredReservations.length} resultados</span>
            </div>
            {loading ? <div className="cashier-loading">Cargando agenda...</div> : filteredReservations.length === 0 ? (
              <EmptyState icon={<CalendarDays size={24} />} title="No hay reservas con estos filtros" description="Cambia la fecha o registra una nueva reserva." />
            ) : (
              <div className="reservation-list">
                {filteredReservations.map((reservation) => (
                  <article className={`reservation-card status-${reservation.estado}`} key={reservation.id_reserva}>
                    <div className="reservation-card-head">
                      <div className="reservation-date"><CalendarDays size={17} /><strong>{formatReservationDate(reservation.fecha_reserva)}</strong></div>
                      <span className={`reservation-status status-${reservation.estado}`}>{STATUS_LABELS[reservation.estado] || reservation.estado}</span>
                    </div>
                    <div className="reservation-main">
                      <div>
                        <h3>{reservation.cliente?.nombre || `Cliente #${reservation.id_cliente}`}</h3>
                        <div className="reservation-details">
                          {reservation.cliente?.telefono && <span><Phone size={14} /> {reservation.cliente.telefono}</span>}
                          <span><Table2 size={14} /> Mesa {reservation.mesa?.numero_mesa || reservation.id_mesa}</span>
                          <span><UsersRound size={14} /> {reservation.tamano_grupo} personas</span>
                        </div>
                        {reservation.notas && <p className="reservation-note">“{reservation.notas}”</p>}
                      </div>
                      <div className="reservation-id">R-{String(reservation.id_reserva).padStart(3, '0')}</div>
                    </div>
                    <div className="reservation-actions">
                      {reservation.estado === 'pendiente' && <button className="action-confirm" onClick={() => updateReservationStatus(reservation, 'confirmada')}><Check size={15} /> Confirmar</button>}
                      {reservation.estado === 'confirmada' && <button className="action-complete" onClick={() => updateReservationStatus(reservation, 'completada')}><CheckCircle2 size={15} /> Llegó</button>}
                      {(reservation.estado === 'pendiente' || reservation.estado === 'confirmada') && <button className="action-cancel" onClick={() => updateReservationStatus(reservation, 'cancelada')}><Ban size={15} /> Cancelar</button>}
                      <button className="action-edit" onClick={() => openEditModal(reservation)}>Editar</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="cashier-side-column">
            <section className="cashier-panel table-panel">
              <div className="cashier-panel-heading"><div><p className="cashier-eyebrow">Salón</p><h2>Estado de mesas</h2></div><MapPin size={19} /></div>
              <div className="table-grid">
                {mesas.map((mesa) => {
                  const state = tableStatesById.get(mesa.id_mesa)?.estado || 'libre';
                  return <div className={`table-tile table-${state}`} key={mesa.id_mesa}><span className="table-number">{mesa.numero_mesa}</span><span>{TABLE_STATUS_LABELS[state] || state}</span><small>{mesa.capacidad} pax</small></div>;
                })}
              </div>
              <div className="table-legend"><span><i className="dot dot-free" /> Libre</span><span><i className="dot dot-busy" /> Ocupada</span><span><i className="dot dot-booked" /> Reservada</span></div>
            </section>
            <section className="cashier-tip-card">
              <div className="tip-icon"><UsersRound size={20} /></div>
              <div><strong>Atención en caja</strong><p>Confirma la reserva al recibir al cliente y marca “Llegó” para mantener el salón actualizado.</p></div>
            </section>
          </aside>
        </div>
        </>)}
      </main>

      {payOrder && <CheckoutModal order={payOrder} onClose={() => setPayOrder(null)} onSuccess={handlePaymentSuccess} />}
      {printedInvoice && <InvoicePrintModal invoice={printedInvoice} order={printedInvoice.orden} onClose={() => setPrintedInvoice(null)} />}

      {modalOpen && (
        <div className="cashier-modal-backdrop" onClick={() => !saving && setModalOpen(false)}>
          <form className="cashier-modal" onSubmit={saveReservation} onClick={(event) => event.stopPropagation()}>
            <div className="cashier-modal-heading"><div><p className="cashier-eyebrow">Gestión de agenda</p><h2>{editingReservation ? 'Editar reserva' : 'Nueva reserva'}</h2></div><button type="button" className="cashier-close-button" onClick={() => setModalOpen(false)} disabled={saving}><X size={19} /></button></div>
            <div className="cashier-form-grid">
              <label className="cashier-field cashier-field-wide"><span>Cliente</span><select value={form.id_cliente} onChange={(event) => setForm({ ...form, id_cliente: event.target.value })} required><option value="">Selecciona un cliente</option>{clientes.map((client) => <option key={client.id_cliente} value={client.id_cliente}>{client.nombre} · {client.telefono || 'sin teléfono'}</option>)}</select></label>
              <label className="cashier-field"><span>Mesa</span><select value={form.id_mesa} onChange={(event) => setForm({ ...form, id_mesa: event.target.value })} required><option value="">Selecciona mesa</option>{mesas.map((mesa) => <option key={mesa.id_mesa} value={mesa.id_mesa}>Mesa {mesa.numero_mesa} · {mesa.capacidad} pax</option>)}</select></label>
              <label className="cashier-field"><span>Personas</span><input type="number" min="1" max="30" value={form.tamano_grupo} onChange={(event) => setForm({ ...form, tamano_grupo: event.target.value })} required /></label>
              <label className="cashier-field cashier-field-wide"><span>Fecha y hora</span><input type="datetime-local" value={form.fecha_reserva} onChange={(event) => setForm({ ...form, fecha_reserva: event.target.value })} required /></label>
              <label className="cashier-field cashier-field-wide"><span>Notas</span><textarea rows="3" value={form.notas} onChange={(event) => setForm({ ...form, notas: event.target.value })} placeholder="Preferencias, ocasión especial o requerimientos..." /></label>
            </div>
            <div className="cashier-modal-footer"><button type="button" className="cashier-secondary-button" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</button><button type="submit" className="cashier-primary-button" disabled={saving}>{saving ? 'Guardando...' : editingReservation ? 'Guardar cambios' : 'Crear reserva'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
