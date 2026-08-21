import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import Tarjeta from "../../shared/components/Tarjeta";
import { useDashboard } from "./useDashboard";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

// Dashboard: panel con estadísticas y gráficas, página de entrada de la
// zona de administrador (/admin).

const tarjetasConfig = [
  { clave: "clientes", titulo: "Clientes", color: "blue" },
  { clave: "productos", titulo: "Productos", color: "green" },
  { clave: "tiendas", titulo: "Tiendas", color: "purple" },
  { clave: "pedidos", titulo: "Pedidos", color: "orange" },
  { clave: "usuarios", titulo: "Usuarios", color: "cyan" },
  { clave: "categorias", titulo: "Categorías", color: "pink" },
];

const opcionesGrafica = {
  responsive: true,
  plugins: { legend: { display: false } },
};

function Dashboard() {
  const { resumen, cargando, error } = useDashboard();

  const datosPedidosPorTienda = {
    labels: resumen?.pedidos_por_tienda?.map((item) => item.tienda) ?? [],
    datasets: [
      {
        label: "Pedidos",
        data: resumen?.pedidos_por_tienda?.map((item) => item.cantidad) ?? [],
        backgroundColor: "#3b82f6",
        borderRadius: 6,
      },
    ],
  };

  const datosPedidosPorEstado = {
    labels: resumen?.pedidos_por_estado?.map((item) => item.estado) ?? [],
    datasets: [
      {
        data: resumen?.pedidos_por_estado?.map((item) => item.cantidad) ?? [],
        backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
      },
    ],
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Panel de Tienda</h1>
      <p className="text-gray-500 mb-6">Resumen general del negocio</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {tarjetasConfig.map((tarjeta) => (
          <Tarjeta
            key={tarjeta.clave}
            titulo={tarjeta.titulo}
            valor={cargando ? "..." : resumen?.tarjetas[tarjeta.clave] ?? 0}
            color={tarjeta.color}
          />
        ))}
      </div>

      {/* Gráficas con datos reales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">Pedidos por Tienda</h2>
          {cargando ? (
            <p className="text-gray-400 text-center py-10">Cargando...</p>
          ) : (
            <Bar data={datosPedidosPorTienda} options={opcionesGrafica} />
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-4">Pedidos por Estado</h2>
          {cargando ? (
            <p className="text-gray-400 text-center py-10">Cargando...</p>
          ) : (
            <div className="max-w-65 mx-auto">
              <Doughnut data={datosPedidosPorEstado} options={opcionesGrafica} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
