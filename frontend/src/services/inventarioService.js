import apiClient from './apiClient';

export const inventarioService = {
  getIngredientes: () => apiClient.get('/ingredientes/'),
  createIngrediente: (data) => apiClient.post('/ingredientes/', data),
  updateIngrediente: (id, data) => apiClient.put(`/ingredientes/${id}`, data),
  
  getMovimientos: () => apiClient.get('/movimientos_inventario/'),
  registrarMovimiento: (data) => apiClient.post('/movimientos_inventario/', data),

  getProveedores: () => apiClient.get('/proveedores/'),
  getOrdenesCompra: () => apiClient.get('/ordenes_compra/'),
};