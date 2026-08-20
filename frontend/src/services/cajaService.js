import apiClient from './apiClient';

export const cajaService = {
  getSesion: (idUsuario) => apiClient.get(`/caja/sesion/${idUsuario}`),
  getSesiones: (idUsuario) => apiClient.get('/caja/sesiones', { params: { id_usuario: idUsuario } }),
  abrirSesion: (data) => apiClient.post('/caja/sesiones', data),
  cerrarSesion: (idSesion, data) => apiClient.put(`/caja/sesiones/${idSesion}/cerrar`, data),
  getMovimientos: (idSesion) => apiClient.get(`/caja/sesiones/${idSesion}/movimientos`),
  crearMovimiento: (idSesion, data) => apiClient.post(`/caja/sesiones/${idSesion}/movimientos`, data),
};
