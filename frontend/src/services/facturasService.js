import apiClient from './apiClient';

export const facturasService = {
  getFacturas: () => apiClient.get('/facturas/'),
  getFactura: (id) => apiClient.get(`/facturas/${id}`),
  createFactura: (data) => apiClient.post('/facturas/', data),
  updateFactura: (id, data) => apiClient.put(`/facturas/${id}`, data),
  deleteFactura: (id) => apiClient.delete(`/facturas/${id}`),
};