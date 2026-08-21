import { useEffect, useState } from "react";
import { obtenerResumenDashboard } from "./dashboardApi";

// useDashboard: carga el resumen del dashboard (tarjetas y datos de las
// gráficas), para que Dashboard.jsx solo se ocupe de la vista.
export function useDashboard() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarResumen() {
      setCargando(true);
      setError("");
      try {
        const datos = await obtenerResumenDashboard();
        setResumen(datos);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarResumen();
  }, []);

  return { resumen, cargando, error };
}
