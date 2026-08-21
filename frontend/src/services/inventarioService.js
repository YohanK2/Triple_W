import apiClient from './apiClient';

export const inventarioService = {
  getIngredientes: () => apiClient.get('/ingredientes/'),
  getIngrediente: (id) => apiClient.get(`/ingredientes/${id}`),
  createIngrediente: (data) => apiClient.post('/ingredientes/', data),
  updateIngrediente: (id, data) => apiClient.put(`/ingredientes/${id}`, data),
  deleteIngrediente: (id) => apiClient.delete(`/ingredientes/${id}`),

  getMovimientos: () => apiClient.get('/movimientos_inventario/'),
  registrarMovimiento: (data) => apiClient.post('/movimientos_inventario/', data),
};
