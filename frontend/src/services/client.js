/**
 * Cliente HTTP para la API.
 * Apunta por defecto a /api (mismo origen). Se puede sobrescribir
 * con la variable de entorno VITE_API_URL.
 *
 * Contrato de endpoints esperado (una accion por endpoint o un solo
 * endpoint tipo router con `action`):
 *   POST   /api/login                  { username, password }
 *   POST   /api/logout
 *   GET    /api/current-user
 *   GET    /api/menu
 *   POST   /api/menu                   { name, description, category, price, image_data, available }
 *   PUT    /api/menu/:id               { ... }
 *   DELETE /api/menu/:id
 *   PATCH  /api/menu/:id/toggle
 *   GET    /api/orders                 ?status=&server_id=&date_from=&date_to=
 *   GET    /api/orders/:id
 *   POST   /api/orders                 { table_number, notes, items: [{ menu_item_id, quantity, special_instructions }] }
 *   PATCH  /api/orders/:id/status      { new_status }
 *   GET    /api/kitchen-queue
 *   GET    /api/dashboard-stats
 *   GET    /api/revenue                ?from=&to=
 *   GET    /api/top-items              ?limit=
 *   GET    /api/revenue-chart          ?days=
 *   POST   /api/orders/:id/pay         { payment_method, reference }
 *   GET    /api/notifications
 *   GET    /api/users
 *   POST   /api/users                  { username, password, name, role }
 *   PATCH  /api/users/:id/toggle
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function buildUrl(path, params) {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') qs.append(k, v);
    });
    const q = qs.toString();
    if (q) url += (url.includes('?') ? '&' : '?') + q;
  }
  return url;
}

async function request(path, { method = 'GET', body, params } = {}) {
  const options = { method, credentials: 'include' };
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  options.headers = headers;

  let response;
  try {
    response = await fetch(buildUrl(path, params), options);
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor. Verifica tu backend.');
  }

  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok || (result && result.error)) {
    const msg = (result && (result.error || result.message)) || `Error ${response.status}`;
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }
  return result;
}

export const apiClient = {
  login: (username, password) => request('/login', { method: 'POST', body: { username, password } }),
  logout: () => request('/logout', { method: 'POST' }),
  getCurrentUser: () => request('/current-user'),

  getMenu: () => request('/menu'),
  createMenuItem: (data) => request('/menu', { method: 'POST', body: data }),
  updateMenuItem: (id, data) => request(`/menu/${id}`, { method: 'PUT', body: data }),
  deleteMenuItem: (id) => request(`/menu/${id}`, { method: 'DELETE' }),
  toggleMenuItem: (id) => request(`/menu/${id}/toggle`, { method: 'PATCH' }),

  getOrders: (filters = {}) => request('/orders', { params: filters }),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: data }),
  updateOrderStatus: (orderId, newStatus) => request(`/orders/${orderId}/status`, { method: 'PATCH', body: { new_status: newStatus } }),
  getKitchenQueue: () => request('/kitchen-queue'),
  processPayment: (orderId, paymentMethod, reference = null) =>
    request(`/orders/${orderId}/pay`, { method: 'POST', body: { payment_method: paymentMethod, reference } }),

  getDashboardStats: () => request('/dashboard-stats'),
  getRevenue: (from, to) => request('/revenue', { params: { from, to } }),
  getTopItems: (limit = 10) => request('/top-items', { params: { limit } }),
  getRevenueChart: (days = 7) => request('/revenue-chart', { params: { days } }),
  getNotifications: () => request('/notifications'),

  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  toggleUser: (id) => request(`/users/${id}/toggle`, { method: 'PATCH' }),
};
