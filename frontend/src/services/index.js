/**
 * Capa API unificada.
 *
 * - Si VITE_USE_MOCK === '1'  → usa el backend simulado (localStorage).
 * - Si VITE_API_URL está definido → usa el cliente HTTP real.
 * - De lo contrario (sin variables) → usa el modo demo por defecto.
 *
 * Para conectar tu backend real:
 *   VITE_API_URL=https://api.tuservidor.com  npm run dev
 *   o exporta VITE_API_URL en el entorno de build.
 */

import { apiClient } from './client';
import { apiMock } from './mock';

const useMock =
  import.meta.env.VITE_USE_MOCK === '1' ||
  !import.meta.env.VITE_API_URL;

export const API_MODE = useMock ? 'mock' : 'http';

export const api = useMock ? apiMock : apiClient;
