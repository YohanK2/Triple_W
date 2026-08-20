/**
 * Normaliza cualquier string de rol a un identificador canónico en minúsculas.
 * Ejemplos: "Administrador" -> "admin", "Mesero" -> "mesero", "Cocinero" -> "cocina"
 */
export function normalizeRole(roleName = '') {
  const clean = String(roleName).toLowerCase().trim();

  if (clean.includes('admin')) return 'admin';
  if (clean.includes('meser') || clean.includes('mesero') || clean.includes('camarero')) return 'mesero';
  if (clean.includes('cocin') || clean.includes('chef') || clean.includes('cook')) return 'cocinero';
  if (clean.includes('caj') || clean.includes('cashier')) return 'cajero';

  return 'mesero'; // Rol fallback por defecto
}

/**
 * Define a qué vista debe ir cada rol inmediatamente después de loguearse.
 */
export const DASHBOARD_ROUTES = {
  admin: '/admin',
  mesero: '/mesero',
  cocinero: '/Cocinero',
  cajero: '/Cocinero',
};

/**
 * Obtiene la ruta de destino según el rol del usuario.
 */
export function getDestinationRoute(roleName) {
  const canonical = normalizeRole(roleName);
  return DASHBOARD_ROUTES[canonical] || '/login';
}