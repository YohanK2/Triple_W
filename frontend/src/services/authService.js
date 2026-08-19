import apiClient from './apiClient';
import { STORAGE_KEYS } from '../utils/constants';

export const authService = {
  // POST /auth/login -> Recibe { nombre_usuario, contrasena }
  async login(nombre_usuario, contrasena) {
    const data = await apiClient.post('/auth/login', {
      nombre_usuario,
      contrasena,
    });
    // FastAPI retorna { token: string, usuario: UsuarioResponse }
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.usuario));
    }
    return data;
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getStoredUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getStoredToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
};