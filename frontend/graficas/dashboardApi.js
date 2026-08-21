import apiClient from "../../shared/config/apiClient";
import { manejarErrorApi } from "../../shared/utils/manejarErrorApi";

// dashboardApi: funciones para consumir el endpoint /dashboard del servidor.

export async function obtenerResumenDashboard() {
  try {
    const respuesta = await apiClient.get("/dashboard/resumen");
    return respuesta.data;
  } catch (error) {
    manejarErrorApi(error);
  }
}
