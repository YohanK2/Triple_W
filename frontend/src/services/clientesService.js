import apiClient from './apiClient';

export const clientesService = {
  getClientes: () => apiClient.get('/clientes/'),
  getCliente: (id) => apiClient.get(`/clientes/${id}`),
  createCliente: (data) => apiClient.post('/clientes/', data),
  updateCliente: (id, data) => apiClient.put(`/clientes/${id}`, data),
  deleteCliente: (id) => apiClient.delete(`/clientes/${id}`),
};
