import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrdersContext, UI_TO_DB, DB_TO_UI } from './ordersCore';
import { ordenesService } from '../services/ordenesService';
import { mesasService } from '../services/mesasService';
import { menuService } from '../services/menuService';
import { facturasService } from '../services/facturasService';
import { useAuth } from './AuthContext';
import { TAX_RATE } from '../config';

function hhmm(dateStr) {
  if (!dateStr) return '';
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/* Convierte filas de /ordenes + /items_orden + /items_menu al shape UI */
function buildOrders(ordenes, itemsOrden, menuItems, mesas) {
  const menuMap = new Map(menuItems.map((m) => [m.id_item_menu, m.nombre]));
  const mesaMap = new Map(mesas.map((m) => [m.id_mesa, m.numero_mesa]));
  return ordenes.map((o) => ({
    id: o.id_orden,
    mesaId: o.id_mesa,
    mesa: mesaMap.get(o.id_mesa) ?? o.id_mesa,
    meseroId: o.id_mesero,
    mesero: o.nombre_mesero || `#${o.id_mesero}`,
    clienteId: o.id_cliente ?? null,
    estado: DB_TO_UI[o.estado] || 'pendiente',
    estadoDb: o.estado,
    hora: hhmm(o.creado_en),
    creadoEn: o.creado_en,
    notas: o.notas || '',
    subtotal: Number(o.subtotal),
    impuesto: Number(o.impuesto),
    total: Number(o.total),
    items: itemsOrden
      .filter((i) => i.id_orden === o.id_orden)
      .map((i) => ({
        id: i.id_item_orden,
        idItemMenu: i.id_item_menu,
        nombre: i.nombre || menuMap.get(i.id_item_menu) || `Item #${i.id_item_menu}`,
        cantidad: i.cantidad,
        precio: Number(i.precio_unitario),
        instrucciones: i.instrucciones_especiales || '',
      })),
  }));
}

export default function OrdersProvider({ children }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const [ordenes, itemsOrden, menuCatalog, mesas] = await Promise.all([
        ordenesService.getOrdenes(),
        ordenesService.getItemsOrden(),
        menuService.getItems(),
        mesasService.getMesas(),
      ]);
      setOrders(buildOrders(ordenes, itemsOrden, menuCatalog, mesas));
    } catch (e) {
      setError(e.message || 'Error cargando órdenes');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /* Sincronización en vivo: polling periódico + refresco al volver a la pestaña,
     para que cambios hechos en otra sesión (p. ej. cancelar desde admin) se reflejen aquí */
  useEffect(() => {
    const id = setInterval(() => refresh({ silent: true }), 20000);
    const onFocus = () => {
      if (document.visibilityState === 'visible') refresh({ silent: true });
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [refresh]);

  const setMesaEstado = useCallback(async (idMesa, estado) => {
    try {
      await mesasService.setEstado(idMesa, estado, user?.id_usuario ?? 1);
    } catch {
      /* la mesa sigue funcional aunque falle el registro de estado */
    }
  }, [user]);

  const createOrder = useCallback(async ({ mesaId, items, notas = '' }) => {
    const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const impuesto = Math.round(subtotal * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + impuesto) * 100) / 100;

    const res = await ordenesService.createOrden({
      id_cliente: null,
      id_mesa: mesaId,
      id_mesero: user?.id_usuario ?? 1,
      subtotal,
      impuesto,
      total,
      estado: 'pendiente',
      notas: notas || null,
    });

    for (const i of items) {
      await ordenesService.createItemOrden({
        id_orden: res.id_orden,
        id_item_menu: i.id_item_menu,
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        subtotal: Math.round(i.precio * i.cantidad * 100) / 100,
        instrucciones_especiales: i.instrucciones || null,
      });
    }

    await setMesaEstado(mesaId, 'ocupada');
    await refresh();
    return res.id_orden;
  }, [user, setMesaEstado, refresh]);

  const updateEstado = useCallback(async (order, nuevoEstadoUi) => {
    await ordenesService.updateOrden(order.id, {
      id_cliente: order.clienteId ?? null,
      id_mesa: order.mesaId,
      id_mesero: order.meseroId,
      subtotal: order.subtotal,
      impuesto: order.impuesto,
      total: order.total,
      estado: UI_TO_DB[nuevoEstadoUi],
      notas: order.notas || null,
    });
    await refresh();
  }, [refresh]);

  const advanceOrder = useCallback(async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const next = { pendiente: 'preparacion', preparacion: 'lista', lista: 'entregada', entregada: 'pagada' }[order.estado];
    if (!next) return;
    await updateEstado(order, next);
  }, [orders, updateEstado]);

  const cancelOrder = useCallback(async (id) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    await updateEstado(order, 'cancelada');
    await setMesaEstado(order.mesaId, 'libre');
  }, [orders, updateEstado, setMesaEstado]);

  const payOrder = useCallback(async (id, metodoPago, referencia = '') => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    await facturasService.createFactura({
      id_orden: order.id,
      numero_factura: `F-${Date.now()}`,
      subtotal: order.subtotal,
      impuesto: order.impuesto,
      total: order.total,
      metodo_pago: metodoPago,
      numero_referencia: referencia || null,
      creado_por: user?.id_usuario ?? 1,
    });
    await updateEstado(order, 'pagada');
    await setMesaEstado(order.mesaId, 'libre');
  }, [orders, updateEstado, setMesaEstado, user]);

  const value = useMemo(
    () => ({ orders, loading, error, refresh, createOrder, advanceOrder, cancelOrder, payOrder }),
    [orders, loading, error, refresh, createOrder, advanceOrder, cancelOrder, payOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}
