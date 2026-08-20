import { TAX_RATE } from '../config.js';

export { TAX_RATE };

export const STATUS_LABELS = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Lista',
  served: 'Servida',
  paid: 'Pagada',
  cancelled: 'Cancelada',
};

export const CATEGORY_LABELS = {
  entrada: 'Entradas',
  plato_fuerte: 'Platos Fuertes',
  postre: 'Postres',
  bebida: 'Bebidas',
  acompanamiento: 'Acompañamientos',
};

export const ROLE_LABELS = {
  admin: 'Administrador',
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cajero: 'Cajero',
};

export function formatMoney(amount) {
  return '$' + parseFloat(amount || 0).toFixed(2);
}

export function formatDateTime(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr || '';
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Math.floor((Date.now() - date) / 60000);
  if (diff < 1) return 'Ahora';
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export function getElapsedMinutes(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date) / 60000);
}

export function categoryLabel(cat) {
  return CATEGORY_LABELS[cat] || cat;
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || role;
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function badgeClass(status) {
  return `badge badge-${status}`;
}

export function formatDateKey(date) {
  return date.toISOString().split('T')[0];
}

export function toISODate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}
