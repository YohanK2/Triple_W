export const STORAGE_KEYS = {
  TOKEN: 'triplew_token',
  USER: 'triplew_user',
};

export const FINANCIAL_CONFIG = {
  TAX_RATE: 0.16,
};

export const TAX_RATE = FINANCIAL_CONFIG?.TAX_RATE || 0.16;

export const STATUS_LABELS = {
  // Estados en Español (Base de Datos Real)
  pendiente: 'Pendiente',
  preparando: 'En Preparación',
  listo: 'Lista para Servir',
  servido: 'Servido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
  // Fallbacks en Inglés
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Lista',
  served: 'Servido',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

export const STATUS_CLASSES = {
  pendiente: 'badge-pending',
  preparando: 'badge-preparing',
  listo: 'badge-ready',
  servido: 'badge-served',
  pagado: 'badge-paid',
  cancelado: 'badge-cancelled',
  // Fallbacks
  pending: 'badge-pending',
  preparing: 'badge-preparing',
  ready: 'badge-ready',
  served: 'badge-served',
  paid: 'badge-paid',
  cancelled: 'badge-cancelled',
};

export const ROLE_LABELS = {
  admin: 'Administrador',
  mesero: 'Mesero',
  cocinero: 'Cocinero',
  cajero: 'Cajero',
};

export function formatMoney(amount) {
  const num = parseFloat(amount || 0);
  return '$' + (isNaN(num) ? '0.00' : num.toFixed(2));
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Math.floor((Date.now() - date) / 60000);
  if (diff < 1) return 'Hace un momento';
  if (diff < 60) return `Hace ${diff} min`;
  if (diff < 1440) return `Hace ${Math.floor(diff / 60)}h`;
  return `Hace ${Math.floor(diff / 1440)}d`;
}

export function getElapsedMinutes(dateStr) {
  if (!dateStr) return 0;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 0;
  return Math.floor((Date.now() - date) / 60000);
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || 'Desconocido';
}

export function badgeClass(status) {
  const base = STATUS_CLASSES[status] || 'badge-pending';
  return `badge ${base}`;
}
