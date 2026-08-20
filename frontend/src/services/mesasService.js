import apiClient from './apiClient';

export const mesasService = {
  getMesas: () => apiClient.get('/mesas_restaurante/'),
  getMesa: (id) => apiClient.get(`/mesas_restaurante/${id}`),
  createMesa: (data) => apiClient.post('/mesas_restaurante/', data),
  updateMesa: (id, data) => apiClient.put(`/mesas_restaurante/${id}`, data),
  deleteMesa: (id) => apiClient.delete(`/mesas_restaurante/${id}`),
  
  getEstados: () => apiClient.get('/estado_mesas/'),
  updateEstadoMesa: (idEstado, data) => apiClient.put(`/estado_mesas/${idEstado}`, data),
};
