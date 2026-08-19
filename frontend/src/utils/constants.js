// Claves para persistencia en LocalStorage
export const STORAGE_KEYS = {
  TOKEN: 'triplew_token',
  USER: 'triplew_user',
};

// Estados oficiales de la orden según la lógica del restaurante
export const ORDER_STATUS = {
  PENDIENTE: 'pendiente',
  PREPARANDO: 'preparando',
  LISTO: 'listo',
  SERVIDO: 'servido',
  PAGADO: 'pagado',
  CANCELADA: 'cancelada',
};

// Configuración financiera por defecto
export const FINANCIAL_CONFIG = {
  TAX_RATE: 0.19, // 19% IVA
  CURRENCY_LOCALE: 'es-CO',
};