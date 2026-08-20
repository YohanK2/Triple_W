const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, v),
  removeItem: (k) => storage.delete(k),
};

const { apiMock, reset } = await import('./mock.js');

const ok = (name, cond) => {
  if (!cond) throw new Error('ASSERT FAILED: ' + name);
  console.log('ok - ' + name);
};

const note = (name) => console.log('ok - ' + name);

let pass = 0;

try {
  reset();

  // login fallido
  await apiMock.login('admin', 'wrong').then(() => ok('login incorrecto lanza', false), () => note('login incorrecto rechazado'));

  // login ok admin
  const res = await apiMock.login('admin', 'admin123');
  ok('login admin', res.user.role === 'admin');

  // sin permisos cocina para usuario no admin
  await apiMock.getUsers().then(() => ok('admin puede getUsers', true));
  await apiMock.logout();

  const cook = await apiMock.login('cook1', 'cook123');
  ok('login cook', cook.user.role === 'cook');
  await apiMock.getUsers().then(() => ok('cook bloqueado getUsers (esperado error)', false), () => note('cook bloqueado en getUsers'));

  // Cocinero queue
  const queue = await apiMock.getCocineroQueue();
  ok('Cocinero queue pendiente/preparando', queue.filter((o) => o.status === 'pending').length > 0);

  // mesero: crear orden
  await apiMock.logout();
  await apiMock.login('mesero1', 'mesero123');
  const created = await apiMock.createOrder({ table_number: 3, notes: 'Test', items: [{ menu_item_id: 4, quantity: 2, special_instructions: 'sin cebolla' }] });
  ok('orden creada', created.order_id > 0);

  // transición inválida pending -> paid
  await apiMock.updateOrderStatus(created.order_id, 'paid').then(() => ok('transición inválida lanza', false), () => note('transición inválida rechazada'));

  // flujo cocina completo
  await apiMock.updateOrderStatus(created.order_id, 'preparing');
  await apiMock.updateOrderStatus(created.order_id, 'ready');
  await apiMock.updateOrderStatus(created.order_id, 'served');
  const pay = await apiMock.processPayment(created.order_id, 'cash', 'REF-1');
  ok('pago ok', pay.success === true);

  // stats dashboard
  await apiMock.logout();
  await apiMock.login('admin', 'admin123');
  const stats = await apiMock.getDashboardStats();
  ok('stats dashboard', typeof stats.today_orders === 'number' && stats.active_orders >= 0);

  const chart = await apiMock.getRevenueChart(7);
  ok('revenue chart 7 dias', chart.length === 7 && chart.every((d) => d.date && typeof d.revenue === 'number'));

  const top = await apiMock.getTopItems(5);
  ok('top items', Array.isArray(top));

  const revenue = await apiMock.getRevenue('2020-01-01', '2099-12-31');
  ok('revenue rango', Array.isArray(revenue));

  // notificaciones admin
  const notifs = await apiMock.getNotifications();
  ok('notificaciones admin', Array.isArray(notifs) && notifs.length >= 1);

  // crear usuario
  await apiMock.createUser({ username: 'mesero3', password: 'pass', name: 'Test', role: 'mesero' });
  const users = await apiMock.getUsers();
  ok('usuario creado', users.some((u) => u.username === 'mesero3'));
  await apiMock.toggleUser(users.find((u) => u.username === 'mesero3').id);

  // persistencia sesión
  await apiMock.logout();
  await apiMock.getCurrentUser().then(() => ok('sesión cerrada rechaza', false), () => note('sesión cerrada rechazada'));
  await apiMock.login('admin', 'admin123');
  const me = await apiMock.getCurrentUser();
  ok('sesión restaurada', me.user.username === 'admin');

  // menu CRUD
  await apiMock.createMenuItem({ name: 'Prueba', description: '', category: 'postre', price: 5, available: 1 });
  const menu = await apiMock.getMenu();
  const newItem = menu.find((m) => m.name === 'Prueba');
  ok('menu item creado', !!newItem);
  await apiMock.updateMenuItem(newItem.id, { name: 'Prueba2', description: '', category: 'postre', price: 6, available: 1 });
  await apiMock.deleteMenuItem(newItem.id);
  const menu2 = await apiMock.getMenu();
  ok('menu item eliminado', !menu2.some((m) => m.name === 'Prueba2'));

  // logout
  const out = await apiMock.logout();
  ok('logout', out.success === true);

  console.log('\nTODO EL FLUJO DEMO OK');
} catch (e) {
  console.error('\nFALLO:', e.message);
  process.exit(1);
}
