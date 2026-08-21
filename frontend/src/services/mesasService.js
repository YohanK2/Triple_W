import apiClient from './apiClient';

export const mesasService = {
  getMesas: () => apiClient.get('/mesas_restaurante/'),
  getMesa: (id) => apiClient.get(`/mesas_restaurante/${id}`),
  createMesa: (data) => apiClient.post('/mesas_restaurante/', data),
  updateMesa: (id, data) => apiClient.put(`/mesas_restaurante/${id}`, data),
  deleteMesa: (id) => apiClient.delete(`/mesas_restaurante/${id}`),

  getEstados: () => apiClient.get('/estado_mesas/'),
  createEstado: (data) => apiClient.post('/estado_mesas/', data),
  updateEstadoMesa: (idEstado, data) => apiClient.put(`/estado_mesas/${idEstado}`, data),
  /* UPSERT: una fila de estado por mesa (restricción única en BD) */
  async setEstado(idMesa, estado, uid = 1) {
    const estados = await this.getEstados();
    const actual = estados.find((e) => e.id_mesa === idMesa);
    if (actual) {
      return this.updateEstadoMesa(actual.id_estado, {
        id_mesa: idMesa,
        estado,
        creado_por: actual.creado_por ?? uid,
        actualizado_por: uid,
      });
    }
    return this.createEstado({ id_mesa: idMesa, estado, creado_por: uid, actualizado_por: uid });
  },
};
