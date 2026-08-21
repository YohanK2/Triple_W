import apiClient from './apiClient';

export const notificacionesService = {
  getNotificaciones: () => apiClient.get('/notificaciones/'),
  getNotificacion: (id) => apiClient.get(`/notificaciones/${id}`),
  createNotificacion: (data) => apiClient.post('/notificaciones/', data),
  updateNotificacion: (id, data) => apiClient.put(`/notificaciones/${id}`, data),
  deleteNotificacion: (id) => apiClient.delete(`/notificaciones/${id}`),
};
