import apiClient from './apiClient';

export const ordenesService = {
  // Cabecera de Orden
  getOrdenes: () => apiClient.get('/ordenes/'),
  getOrden: (id) => apiClient.get(`/ordenes/${id}`),
  createOrden: (data) => apiClient.post('/ordenes/', data),
  updateOrden: (id, data) => apiClient.put(`/ordenes/${id}`, data),
  deleteOrden: (id) => apiClient.delete(`/ordenes/${id}`),

  // Detalles de la Orden (Ítems pedidos)
  getItemsOrden: () => apiClient.get('/items_orden/'),
  createItemOrden: (data) => apiClient.post('/items_orden/', data),

  // Trazabilidad de Estados (Cocina / KDS)
  getEstadosDisponibles: () => apiClient.get('/estados_orden/'),
  getHistorialEstados: () => apiClient.get('/registros_estados/'),
  registrarCambioEstado: (data) => apiClient.post('/registros_estados/', data),
};