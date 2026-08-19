import apiClient from './apiClient';

export const menuService = {
  // Categorías
  getCategorias: () => apiClient.get('/categorias_menu/'),
  createCategoria: (data) => apiClient.post('/categorias_menu/', data),
  updateCategoria: (id, data) => apiClient.put(`/categorias_menu/${id}`, data),
  deleteCategoria: (id) => apiClient.delete(`/categorias_menu/${id}`),

  // Platillos / Ítems
  getItems: () => apiClient.get('/items_menu/'),
  getItem: (id) => apiClient.get(`/items_menu/${id}`),
  createItem: (data) => apiClient.post('/items_menu/', data),
  updateItem: (id, data) => apiClient.put(`/items_menu/${id}`, data),
  deleteItem: (id) => apiClient.delete(`/items_menu/${id}`),
};