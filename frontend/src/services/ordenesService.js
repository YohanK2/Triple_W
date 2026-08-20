import apiClient from './apiClient';

const KITCHEN_STATUSES = ['pendiente', 'en_preparacion', 'preparando'];

export const ordenesService = {
  // Cabecera de Orden
  getOrdenes: () => apiClient.get('/ordenes/'),
  getOrden: (id) => apiClient.get(`/ordenes/${id}`),
  createOrden: (data) => apiClient.post('/ordenes/', data),
  updateOrden: (id, data) => apiClient.put(`/ordenes/${id}`, data),
  deleteOrden: (id) => apiClient.delete(`/ordenes/${id}`),
  getOrdenesByStatus: async (estado) => {
    const all = await apiClient.get('/ordenes/');
    return all.filter((o) => o.estado === estado);
  },

  // Items de una orden
  getItemsOrden: () => apiClient.get('/items_orden/'),
  getItemsByOrden: (idOrden) => apiClient.get(`/ordenes/${idOrden}/items`),
  createItemOrden: (data) => apiClient.post('/items_orden/', data),

  // Cola de cocina (órdenes pendientes y en preparación)
  getKitchenQueue: async () => {
    const [ordenesRes, itemsRes, menuRes, usersRes] = await Promise.allSettled([
      apiClient.get('/ordenes/'),
      apiClient.get('/items_orden/'),
      apiClient.get('/items_menu/'),
      apiClient.get('/usuarios/'),
    ]);

    const ordenes = ordenesRes.status === 'fulfilled' && Array.isArray(ordenesRes.value)
      ? ordenesRes.value
      : [];
    const items = itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value)
      ? itemsRes.value
      : [];
    const menu = menuRes.status === 'fulfilled' && Array.isArray(menuRes.value)
      ? menuRes.value
      : [];
    const users = usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)
      ? usersRes.value
      : [];

    const menuById = new Map(menu.map((item) => [item.id_item_menu, item]));
    const usersById = new Map(users.map((user) => [user.id_usuario, user]));

    const queue = ordenes
      .filter((o) => KITCHEN_STATUSES.includes(o.estado))
      .sort((a, b) => (a.id_orden || 0) - (b.id_orden || 0));

    return queue.map((o) => ({
      ...o,
      mesero_name: (() => {
        const mesero = usersById.get(o.id_mesero);
        return mesero
          ? `${mesero.nombres || mesero.nombre_usuario}`
          : o.nombre_mesero || `Mesero #${o.id_mesero || '?'}`;
      })(),
      items: items
        .filter((i) => i.id_orden === o.id_orden)
        .map((item) => ({
          id_item_orden: item.id_item_orden,
          id_item_menu: item.id_item_menu,
          cantidad: item.cantidad,
          nombre: menuById.get(item.id_item_menu)?.nombre || `Platillo #${item.id_item_menu}`,
          instrucciones_especiales: item.instrucciones_especiales || '',
        })),
    }));
  },

  // Trazabilidad de Estados (Cocina / KDS)
  getEstadosDisponibles: () => apiClient.get('/estados_orden/'),
  getHistorialEstados: () => apiClient.get('/registros_estados/'),
  registrarCambioEstado: (data) => apiClient.post('/registros_estados/', data),
};
