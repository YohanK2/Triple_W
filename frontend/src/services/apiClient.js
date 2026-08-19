import axios from "axios";
import { STORAGE_KEYS } from '../utils/constants';

export const API_BASE_URL = "http://127.0.0.1:8001";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Respuesta (Response): Manejo unificado de errores y 401
apiClient.interceptors.response.use(
  (response) => response.data, // Retorna directamente la data limpia sin anidar response.data
  (error) => {
    // Si el token expiró o es inválido
    if (error.response && error.response.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      
      // Evitar bucle infinito si el 401 ocurre en el intento de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Extraer el mensaje descriptivo de FastAPI
    const backendMessage =
      error.response?.data?.detail ||
      error.response?.data?.mensaje ||
      error.message ||
      'Error de conexión con el servidor';

    const customError = new Error(backendMessage);
    customError.status = error.response?.status;
    customError.raw = error;

    return Promise.reject(customError);
  }
);

export default apiClient;
