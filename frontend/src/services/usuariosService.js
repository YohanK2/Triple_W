import apiClient from './apiClient';

export const usuariosService = {
  getUsuarios: () => apiClient.get('/usuarios/'),
  getUsuario: (id) => apiClient.get(`/usuarios/${id}`),
  createUsuario: (data) => apiClient.post('/usuarios/', data),
  updateUsuario: (id, data) => apiClient.put(`/usuarios/${id}`, data),
  deleteUsuario: (id) => apiClient.delete(`/usuarios/${id}`),
  
  getRoles: () => apiClient.get('/roles/'),
  getTurnos: () => apiClient.get('/turnos/'),
  getAsistencias: () => apiClient.get('/asistencias/'),
  registrarAsistencia: (data) => apiClient.post('/asistencias/', data),
};