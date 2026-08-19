import apiClient from './apiClient';

export const dashboardService = {
  getResumen: () => apiClient.get('/dashboard/resumen'),
};