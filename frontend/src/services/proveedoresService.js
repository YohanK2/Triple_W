import apiClient from './apiClient';

export const proveedoresService = {
  getProveedores: () => apiClient.get('/proveedores/'),
  getProveedor: (id) => apiClient.get(`/proveedores/${id}`),
  createProveedor: (data) => apiClient.post('/proveedores/', data),
  updateProveedor: (id, data) => apiClient.put(`/proveedores/${id}`, data),
  deleteProveedor: (id) => apiClient.delete(`/proveedores/${id}`),
  getOrdenesCompra: () => apiClient.get('/ordenes_compra/'),
  createOrdenCompra: (data) => apiClient.post('/ordenes_compra/', data),
  updateOrdenCompra: (id, data) => apiClient.put(`/ordenes_compra/${id}`, data),
  deleteOrdenCompra: (id) => apiClient.delete(`/ordenes_compra/${id}`),
};
