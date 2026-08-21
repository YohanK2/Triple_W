import { createContext, useContext } from 'react';

export const OrdersContext = createContext(null);

/* Estados en UI -> backend (enum MySQL ordenes.estado) */
export const UI_TO_DB = {
  pendiente: 'pendiente',
  preparacion: 'preparando',
  lista: 'listo',
  entregada: 'servido',
  pagada: 'pagada',
  cancelada: 'cancelado',
};

export const DB_TO_UI = {
  pendiente: 'pendiente',
  preparando: 'preparacion',
  listo: 'lista',
  servido: 'entregada',
  pagado: 'pagada',
  cancelado: 'cancelada',
};

export const ORDER_STATES = {
  pendiente: { label: 'Pendiente', next: 'preparacion', nextLabel: 'Iniciar preparación' },
  preparacion: { label: 'En preparación', next: 'lista', nextLabel: 'Marcar lista' },
  lista: { label: 'Lista', next: 'entregada', nextLabel: 'Marcar entregada' },
  entregada: { label: 'Entregada', next: 'pagada', nextLabel: 'Registrar pago' },
  pagada: { label: 'Pagada' },
  cancelada: { label: 'Cancelada' },
};

export const ACTIVE_STATES = ['pendiente', 'preparacion', 'lista', 'entregada'];

export function orderTotal(order) {
  return order.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders debe usarse dentro de OrdersProvider');
  }
  return ctx;
}
