/**
 * Backend simulado (modo demo).
 * Implementa el mismo contrato de API que `client.js` usando
 * localStorage como base de datos. Permite probar todo el frontend
 * sin necesidad de un servidor real.
 *
 * Cuentas demo:
 *   admin   / admin123   (Administrador)
 *   server1 / server123  (Mesero)
 *   cook1   / cook123    (Cocinero)
 */

import { TAX_RATE, TABLES_COUNT } from '../config.js';

const STORAGE_KEY = 'restaurant_mock_v1';

const VALID_TRANSITIONS = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served'],
  served: ['paid'],
  paid: [],
  cancelled: [],
};

function nowISO(offsetMin = 0) {
  return new Date(Date.now() - offsetMin * 60000).toISOString().slice(0, 19).replace('T', ' ');
}

function seed() {
  const passwordHashes = {};
  const hash = (pw) => {
    if (!passwordHashes[pw]) passwordHashes[pw] = 'mock$' + btoa(pw).replace(/=/g, '');
    return passwordHashes[pw];
  };

  const users = [
    { id: 1, username: 'admin', password_hash: hash('admin123'), name: 'Administrador', role: 'admin', active: 1, created_at: nowISO(60 * 24 * 30) },
    { id: 2, username: 'server1', password_hash: hash('server123'), name: 'Carlos Mesero', role: 'server', active: 1, created_at: nowISO(60 * 24 * 29) },
    { id: 3, username: 'server2', password_hash: hash('server123'), name: 'María Mesera', role: 'server', active: 1, created_at: nowISO(60 * 24 * 28) },
    { id: 4, username: 'cook1', password_hash: hash('cook123'), name: 'José Cocinero', role: 'cook', active: 1, created_at: nowISO(60 * 24 * 27) },
    { id: 5, username: 'cook2', password_hash: hash('cook123'), name: 'Ana Cocinera', role: 'cook', active: 1, created_at: nowISO(60 * 24 * 26) },
  ];

  const menuItems = [
    { id: 1, name: 'Nachos Supremos', description: 'Totopos con queso fundido, jalapeños, guacamole y crema', category: 'entrada', price: 8.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 2, name: 'Sopa de Tortilla', description: 'Sopa tradicional con tiras de tortilla, aguacate y queso', category: 'entrada', price: 6, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 3, name: 'Ensalada César', description: 'Lechuga romana, crutones, parmesano y aderezo césar', category: 'entrada', price: 7.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 4, name: 'Tacos al Pastor', description: 'Tres tacos de cerdo adobado con piña, cilantro y cebolla', category: 'plato_fuerte', price: 12, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 5, name: 'Enchiladas Verdes', description: 'Tres enchiladas de pollo bañadas en salsa verde con crema', category: 'plato_fuerte', price: 11.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 6, name: 'Filete de Res', description: 'Filete de 300g a la parrilla con guarnición de vegetales', category: 'plato_fuerte', price: 22, image_url: '/assets/uploads/menu/menu_6a0c72c05ea8f8.84086389.png', available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 7, name: 'Pollo a la Plancha', description: 'Pechuga de pollo con arroz y ensalada fresca', category: 'plato_fuerte', price: 14, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 8, name: 'Burrito Especial', description: 'Burrito grande relleno de carne, frijoles, arroz y queso', category: 'plato_fuerte', price: 13.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 9, name: 'Flan Napolitano', description: 'Flan casero con caramelo', category: 'postre', price: 5.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 10, name: 'Churros con Chocolate', description: 'Seis churros con salsa de chocolate caliente', category: 'postre', price: 6.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 11, name: 'Agua de Horchata', description: 'Vaso de 500ml de horchata casera', category: 'bebida', price: 3, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 12, name: 'Limonada Natural', description: 'Limonada fresca con hielo', category: 'bebida', price: 3.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 13, name: 'Refresco', description: 'Coca-Cola, Sprite o Fanta', category: 'bebida', price: 2.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 14, name: 'Cerveza', description: 'Cerveza nacional o importada', category: 'bebida', price: 4.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 15, name: 'Guacamole Extra', description: 'Porción extra de guacamole fresco', category: 'acompanamiento', price: 3.5, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
    { id: 16, name: 'Arroz con Frijoles', description: 'Porción de arroz rojo y frijoles refritos', category: 'acompanamiento', price: 4, image_url: null, available: 1, created_at: nowISO(60 * 24 * 20) },
  ];

  const orders = [];
  const orderItems = [];
  const transactions = [];
  const statusLogs = [];

  function addOrder(id, serverId, table, status, items, minutesAgo, notes = '') {
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    orders.push({
      id,
      server_id: serverId,
      table_number: table,
      status,
      notes,
      subtotal,
      tax,
      total: Math.round((subtotal + tax) * 100) / 100,
      created_at: nowISO(minutesAgo),
      updated_at: nowISO(Math.max(minutesAgo - 2, 0)),
    });
    items.forEach((i) => {
      orderItems.push({
        id: orderItems.length + 1,
        order_id: id,
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        subtotal: i.unit_price * i.quantity,
        special_instructions: i.special_instructions || '',
      });
    });
    statusLogs.push({ id: statusLogs.length + 1, order_id: id, old_status: null, new_status: status, changed_by: serverId, notes: null, created_at: nowISO(minutesAgo) });
  }

  const precio = (id) => menuItems.find((m) => m.id === id).price;

  // Ordenes activas de ejemplo
  addOrder(1, 2, 4, 'pending', [
    { menu_item_id: 4, quantity: 2, unit_price: precio(4) },
    { menu_item_id: 13, quantity: 2, unit_price: precio(13) },
  ], 6, 'Sin cebolla en un taco');
  addOrder(2, 3, 7, 'preparing', [
    { menu_item_id: 6, quantity: 1, unit_price: precio(6) },
    { menu_item_id: 15, quantity: 1, unit_price: precio(15) },
    { menu_item_id: 11, quantity: 1, unit_price: precio(11) },
  ], 12);
  addOrder(3, 2, 2, 'ready', [
    { menu_item_id: 5, quantity: 3, unit_price: precio(5) },
    { menu_item_id: 14, quantity: 2, unit_price: precio(14) },
  ], 21);

  // Historial de ejemplo (hoy y dias anteriores)
  addOrder(4, 3, 1, 'paid', [
    { menu_item_id: 1, quantity: 1, unit_price: precio(1) },
    { menu_item_id: 9, quantity: 2, unit_price: precio(9) },
    { menu_item_id: 11, quantity: 2, unit_price: precio(11) },
  ], 140);
  addOrder(5, 2, 5, 'paid', [
    { menu_item_id: 4, quantity: 3, unit_price: precio(4) },
    { menu_item_id: 12, quantity: 3, unit_price: precio(12) },
  ], 190);
  addOrder(6, 3, 8, 'cancelled', [
    { menu_item_id: 7, quantity: 1, unit_price: precio(7) },
  ], 220);
  addOrder(7, 2, 3, 'paid', [
    { menu_item_id: 2, quantity: 2, unit_price: precio(2) },
    { menu_item_id: 8, quantity: 1, unit_price: precio(8) },
    { menu_item_id: 10, quantity: 1, unit_price: precio(10) },
  ], 60 * 26);
  addOrder(8, 3, 6, 'paid', [
    { menu_item_id: 3, quantity: 2, unit_price: precio(3) },
    { menu_item_id: 16, quantity: 2, unit_price: precio(16) },
  ], 60 * 50);
  addOrder(9, 2, 9, 'paid', [
    { menu_item_id: 6, quantity: 2, unit_price: precio(6) },
    { menu_item_id: 14, quantity: 4, unit_price: precio(14) },
  ], 60 * 30 * 2);

  // Transacciones para ordenes pagadas
  const paidOrders = orders.filter((o) => o.status === 'paid');
  paidOrders.forEach((o) => {
    transactions.push({
      id: transactions.length + 1,
      order_id: o.id,
      amount: o.total,
      payment_method: o.id % 3 === 0 ? 'card' : 'cash',
      reference_number: null,
      created_at: o.created_at,
    });
  });

  return {
    users,
    menuItems,
    orders,
    orderItems,
    transactions,
    statusLogs,
    seq: { users: users.length + 1, menuItems: menuItems.length + 1, orders: orders.length + 1, orderItems: orderItems.length + 1, transactions: transactions.length + 1, statusLogs: statusLogs.length + 1 },
    sessionUserId: null,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  const db = seed();
  save(db);
  return db;
}

function save(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let db = load();

function reset() {
  db = seed();
  save(db);
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function currentUser() {
  const u = db.users.find((x) => x.id === db.sessionUserId);
  return u && u.active === 1 ? u : null;
}

function publicUser(u) {
  return { id: u.id, username: u.username, name: u.name, role: u.role };
}

function requireAuth() {
  const u = currentUser();
  if (!u) {
    const e = new Error('No autenticado');
    e.status = 401;
    throw e;
  }
  return u;
}

function requireRole(roles) {
  const u = requireAuth();
  const list = Array.isArray(roles) ? roles : [roles];
  if (!list.includes(u.role)) {
    const e = new Error('No tienes permisos para realizar esta acción');
    e.status = 403;
    throw e;
  }
  return u;
}

function next(seqKey) {
  db.seq[seqKey] += 1;
  return db.seq[seqKey];
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function withItems(order) {
  const items = db.orderItems
    .filter((oi) => oi.order_id === order.id)
    .map((oi) => {
      const mi = db.menuItems.find((m) => m.id === oi.menu_item_id);
      return {
        ...oi,
        item_name: mi ? mi.name : 'Eliminado',
        category: mi ? mi.category : null,
      };
    });
  const server = db.users.find((u) => u.id === order.server_id);
  return { ...order, items, server_name: server ? server.name : '-' };
}

function verifyPassword(pw, hash) {
  return hash === 'mock$' + btoa(pw).replace(/=/g, '');
}

// ────────────────────────── API ──────────────────────────

const apiMock = {
  async login(username, password) {
    await delay(300);
    const user = db.users.find((u) => u.username === username && u.active === 1);
    if (!user || !verifyPassword(password, user.password_hash)) {
      const e = new Error('Usuario o contraseña incorrectos');
      e.status = 401;
      throw e;
    }
    db.sessionUserId = user.id;
    save(db);
    return { user: publicUser(user) };
  },

  async logout() {
    db.sessionUserId = null;
    save(db);
    return { success: true };
  },

  async getCurrentUser() {
    await delay(50);
    const u = currentUser();
    if (!u) {
      const e = new Error('No autenticado');
      e.status = 401;
      throw e;
    }
    return { user: publicUser(u) };
  },

  // ── Menú ──
  async getMenu() {
    await delay(150);
    requireAuth();
    return db.menuItems.map((m) => ({ ...m }));
  },

  async createMenuItem(data) {
    await delay(200);
    requireRole('admin');
    const item = {
      id: next('menuItems'),
      name: data.name,
      description: data.description || '',
      category: data.category,
      price: parseFloat(data.price),
      image_url: data.image_data ? data.image_data : null,
      available: data.available ?? 1,
      created_at: nowISO(),
    };
    db.menuItems.push(item);
    save(db);
    return { success: true, id: item.id };
  },

  async updateMenuItem(id, data) {
    await delay(200);
    requireRole('admin');
    const item = db.menuItems.find((m) => m.id === id);
    if (!item) throw new Error('Producto no encontrado');
    Object.assign(item, {
      name: data.name,
      description: data.description || '',
      category: data.category,
      price: parseFloat(data.price),
      available: data.available ?? 1,
    });
    if (data.image_data) item.image_url = data.image_data;
    save(db);
    return { success: true };
  },

  async deleteMenuItem(id) {
    await delay(200);
    requireRole('admin');
    db.menuItems = db.menuItems.filter((m) => m.id !== id);
    save(db);
    return { success: true };
  },

  async toggleMenuItem(id) {
    await delay(150);
    requireRole('admin');
    const item = db.menuItems.find((m) => m.id === id);
    if (item) {
      item.available = item.available === 1 ? 0 : 1;
      save(db);
    }
    return { success: true };
  },

  // ── Órdenes ──
  async getOrders(filters = {}) {
    await delay(150);
    const user = requireAuth();
    let list = [...db.orders];

    if (user.role === 'server') filters = { ...filters, server_id: user.id };

    if (filters.status) list = list.filter((o) => o.status === filters.status);
    if (filters.server_id) list = list.filter((o) => o.server_id === Number(filters.server_id));
    if (filters.date_from) list = list.filter((o) => o.created_at.slice(0, 10) >= filters.date_from);
    if (filters.date_to) list = list.filter((o) => o.created_at.slice(0, 10) <= filters.date_to);

    return list
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, 100)
      .map((o) => {
        const server = db.users.find((u) => u.id === o.server_id);
        return { ...o, server_name: server ? server.name : '-' };
      });
  },

  async getOrder(id) {
    await delay(120);
    requireAuth();
    const order = db.orders.find((o) => o.id === Number(id));
    if (!order) throw new Error('Orden no encontrada');
    return withItems(order);
  },

  async createOrder(data) {
    await delay(250);
    requireRole(['admin', 'server']);
    const user = requireAuth();

    if (!data.table_number) throw new Error('Selecciona una mesa');
    if (!data.items || data.items.length === 0) throw new Error('La orden está vacía');

    let subtotal = 0;
    const items = data.items.map((it) => {
      const mi = db.menuItems.find((m) => m.id === it.menu_item_id && m.available === 1);
      if (!mi) throw new Error(`Item de menú #${it.menu_item_id} no disponible`);
      const unit_price = parseFloat(mi.price);
      const s = unit_price * it.quantity;
      subtotal += s;
      return {
        menu_item_id: it.menu_item_id,
        quantity: it.quantity,
        unit_price,
        subtotal: s,
        special_instructions: it.special_instructions || '',
      };
    });

    const tax = round2(subtotal * TAX_RATE);
    const id = next('orders');
    db.orders.push({
      id,
      server_id: user.id,
      table_number: Number(data.table_number),
      status: 'pending',
      notes: data.notes || '',
      subtotal: round2(subtotal),
      tax,
      total: round2(subtotal + tax),
      created_at: nowISO(),
      updated_at: nowISO(),
    });
    items.forEach((i) => {
      db.orderItems.push({ id: next('orderItems'), order_id: id, ...i });
    });
    db.statusLogs.push({
      id: next('statusLogs'),
      order_id: id,
      old_status: null,
      new_status: 'pending',
      changed_by: user.id,
      notes: null,
      created_at: nowISO(),
    });
    save(db);
    return { success: true, order_id: id };
  },

  async updateOrderStatus(orderId, newStatus) {
    await delay(200);
    const user = requireAuth();
    const order = db.orders.find((o) => o.id === Number(orderId));
    if (!order) throw new Error('Orden no encontrada');

    if (!(VALID_TRANSITIONS[order.status] || []).includes(newStatus)) {
      throw new Error(`Transición de estado no válida: ${order.status} → ${newStatus}`);
    }

    db.statusLogs.push({
      id: next('statusLogs'),
      order_id: order.id,
      old_status: order.status,
      new_status: newStatus,
      changed_by: user.id,
      notes: null,
      created_at: nowISO(),
    });
    order.status = newStatus;
    order.updated_at = nowISO();
    save(db);
    return { success: true };
  },

  async getKitchenQueue() {
    await delay(150);
    requireRole(['admin', 'cook']);
    return db.orders
      .filter((o) => ['pending', 'preparing'].includes(o.status))
      .sort((a, b) => {
        const rank = (s) => (s === 'pending' ? 0 : 1);
        if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
        return a.created_at < b.created_at ? -1 : 1;
      })
      .map(withItems);
  },

  async processPayment(orderId, paymentMethod, reference = null) {
    await delay(250);
    requireRole(['admin', 'server']);
    const user = requireAuth();
    const order = db.orders.find((o) => o.id === Number(orderId));
    if (!order) throw new Error('Orden no encontrada');
    if (order.status !== 'served') throw new Error('La orden debe estar servida para procesar el pago');

    db.transactions.push({
      id: next('transactions'),
      order_id: order.id,
      amount: order.total,
      payment_method: paymentMethod,
      reference_number: reference || null,
      created_at: nowISO(),
    });
    db.statusLogs.push({
      id: next('statusLogs'),
      order_id: order.id,
      old_status: 'served',
      new_status: 'paid',
      changed_by: user.id,
      notes: `Pago: ${paymentMethod}`,
      created_at: nowISO(),
    });
    order.status = 'paid';
    order.updated_at = nowISO();
    save(db);
    return { success: true };
  },

  // ── Reportes (admin) ──
  async getDashboardStats() {
    await delay(180);
    requireRole('admin');
    const today = nowISO().slice(0, 10);
    const month = today.slice(0, 7);

    const todayRevenue = db.transactions.filter((t) => t.created_at.slice(0, 10) === today).reduce((s, t) => s + t.amount, 0);
    const todayOrders = db.orders.filter((o) => o.created_at.slice(0, 10) === today).length;
    const activeOrders = db.orders.filter((o) => !['paid', 'cancelled'].includes(o.status)).length;
    const monthRevenue = db.transactions.filter((t) => t.created_at.slice(0, 7) === month).reduce((s, t) => s + t.amount, 0);
    const paidToday = db.orders.filter((o) => o.created_at.slice(0, 10) === today && o.status === 'paid');
    const avgOrder = paidToday.length ? paidToday.reduce((s, o) => s + o.total, 0) / paidToday.length : 0;
    const tablesServed = new Set(db.orders.filter((o) => o.created_at.slice(0, 10) === today).map((o) => o.table_number)).size;

    return {
      today_revenue: round2(todayRevenue),
      today_orders: todayOrders,
      active_orders: activeOrders,
      month_revenue: round2(monthRevenue),
      avg_order: round2(avgOrder),
      tables_served: tablesServed,
    };
  },

  async getRevenue(from, to) {
    await delay(150);
    requireRole('admin');
    const map = {};
    db.transactions.forEach((t) => {
      const d = t.created_at.slice(0, 10);
      if (d < from || d > to) return;
      if (!map[d]) map[d] = { date: d, transactions_count: 0, total_revenue: 0, amounts: [] };
      map[d].transactions_count += 1;
      map[d].total_revenue += t.amount;
      map[d].amounts.push(t.amount);
    });
    return Object.values(map)
      .map((g) => ({
        date: g.date,
        transactions_count: g.transactions_count,
        total_revenue: round2(g.total_revenue),
        avg_transaction: round2(g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  },

  async getTopItems(limit = 10) {
    await delay(150);
    requireRole('admin');
    const agg = {};
    db.orderItems.forEach((oi) => {
      const order = db.orders.find((o) => o.id === oi.order_id);
      if (!order || order.status !== 'paid') return;
      const mi = db.menuItems.find((m) => m.id === oi.menu_item_id);
      if (!mi) return;
      if (!agg[oi.menu_item_id]) agg[oi.menu_item_id] = { name: mi.name, category: mi.category, price: mi.price, total_sold: 0, total_revenue: 0 };
      agg[oi.menu_item_id].total_sold += oi.quantity;
      agg[oi.menu_item_id].total_revenue += oi.subtotal;
    });
    return Object.values(agg)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, Number(limit))
      .map((i) => ({ ...i, total_revenue: round2(i.total_revenue) }));
  },

  async getRevenueChart(days = 7) {
    await delay(150);
    requireRole('admin');
    const map = {};
    const start = new Date();
    start.setDate(start.getDate() - (Number(days) - 1));
    start.setHours(0, 0, 0, 0);
    db.transactions.forEach((t) => {
      const d = new Date(t.created_at);
      if (d < start) return;
      const key = t.created_at.slice(0, 10);
      map[key] = (map[key] || 0) + t.amount;
    });
    const result = [];
    for (let i = 0; i < Number(days); i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, revenue: round2(map[key] || 0) });
    }
    return result;
  },

  async getNotifications() {
    await delay(120);
    const user = requireAuth();
    const notifications = [];

    if (user.role === 'cook') {
      db.orders
        .filter((o) => o.status === 'pending')
        .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
        .forEach((o) => {
          const minutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
          const server = db.users.find((u) => u.id === o.server_id);
          notifications.push({
            type: 'new_order',
            urgency: minutes > 15 ? 'urgent' : minutes > 8 ? 'warning' : 'info',
            message: `Nueva orden #${o.id} - Mesa ${o.table_number}`,
            detail: `Mesero: ${server ? server.name : '-'} · Hace ${minutes} min`,
            order_id: o.id,
            time: o.created_at,
          });
        });
    } else if (user.role === 'server') {
      db.orders
        .filter((o) => o.status === 'ready' && o.server_id === user.id)
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        .forEach((o) => {
          notifications.push({
            type: 'order_ready',
            urgency: 'success',
            message: `¡Orden #${o.id} lista! - Mesa ${o.table_number}`,
            detail: 'Pasar a recoger a cocina',
            order_id: o.id,
            time: o.created_at,
          });
        });
    } else if (user.role === 'admin') {
      const activeCount = db.orders.filter((o) => !['paid', 'cancelled'].includes(o.status)).length;
      const todayRevenue = db.transactions
        .filter((t) => t.created_at.slice(0, 10) === nowISO().slice(0, 10))
        .reduce((s, t) => s + t.amount, 0);
      notifications.push({
        type: 'summary',
        urgency: 'info',
        message: `${activeCount} órdenes activas`,
        detail: `Ingresos hoy: $${round2(todayRevenue)}`,
      });
      const delayed = db.orders.filter((o) => o.status === 'pending' && (Date.now() - new Date(o.created_at).getTime()) / 60000 > 20).length;
      if (delayed > 0) {
        notifications.push({
          type: 'delayed',
          urgency: 'urgent',
          message: `${delayed} órdenes con retraso`,
          detail: 'Órdenes pendientes por más de 20 minutos',
        });
      }
    }

    return notifications;
  },

  // ── Usuarios (admin) ──
  async getUsers() {
    await delay(150);
    requireRole('admin');
    return db.users
      .map((u) => ({ id: u.id, username: u.username, name: u.name, role: u.role, active: u.active, created_at: u.created_at }))
      .sort((a, b) => (a.role > b.role ? 1 : -1));
  },

  async createUser(data) {
    await delay(200);
    requireRole('admin');
    if (db.users.some((u) => u.username === data.username)) throw new Error('El usuario ya existe');
    db.users.push({
      id: next('users'),
      username: data.username,
      password_hash: 'mock$' + btoa(data.password).replace(/=/g, ''),
      name: data.name,
      role: data.role,
      active: 1,
      created_at: nowISO(),
    });
    save(db);
    return { success: true };
  },

  async toggleUser(id) {
    await delay(150);
    requireRole('admin');
    const u = db.users.find((x) => x.id === Number(id));
    if (u) {
      u.active = u.active === 1 ? 0 : 1;
      save(db);
    }
    return { success: true };
  },
};

export { apiMock, reset, TABLES_COUNT, TAX_RATE };
