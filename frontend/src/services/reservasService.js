import apiClient from './apiClient';

export const reservasService = {
  getReservas: () => apiClient.get('/reservas/'),
  getReserva: (id) => apiClient.get(`/reservas/${id}`),
  createReserva: (data) => apiClient.post('/reservas/', data),
  updateReserva: (id, data) => apiClient.put(`/reservas/${id}`, data),
  deleteReserva: (id) => apiClient.delete(`/reservas/${id}`),
  getClientes: () => apiClient.get('/clientes/'),
  getMesas: () => apiClient.get('/mesas_restaurante/'),
  getEstadosMesas: () => apiClient.get('/estado_mesas/'),
};
