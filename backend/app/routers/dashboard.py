from fastapi import APIRouter, HTTPException
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.dashboard import ResumenDashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _scalar(cursor, sql, params=None):
    """Ejecuta una consulta y devuelve el primer valor de la primera fila (o 0)."""
    cursor.execute(sql, params or ())
    row = cursor.fetchone()
    if not row:
        return 0
    valor = list(row.values())[0]
    return valor if valor is not None else 0


@router.get("/resumen", response_model=ResumenDashboard)
def obtener_resumen_dashboard():
    try:
        conn = get_conn()
        cursor = conn.cursor(dictionary=True)

        # --- Usuarios ---
        total_usuarios = _scalar(cursor, "SELECT COUNT(*) AS c FROM usuarios")
        usuarios_activos = _scalar(cursor, "SELECT COUNT(*) AS c FROM usuarios WHERE activo = 1")

        # --- Clientes ---
        total_clientes = _scalar(cursor, "SELECT COUNT(*) AS c FROM clientes")

        # --- Productos (items del menú) ---
        total_productos = _scalar(cursor, "SELECT COUNT(*) AS c FROM items_menu")
        productos_disponibles = _scalar(
            cursor, "SELECT COUNT(*) AS c FROM items_menu WHERE disponible = 1"
        )

        # --- Mesas ---
        total_mesas = _scalar(cursor, "SELECT COUNT(*) AS c FROM mesas_restaurante")
        mesas_activas = _scalar(
            cursor, "SELECT COUNT(*) AS c FROM mesas_restaurante WHERE activa = 1"
        )

        # --- Proveedores ---
        total_proveedores = _scalar(cursor, "SELECT COUNT(*) AS c FROM proveedores")
        proveedores_activos = _scalar(
            cursor, "SELECT COUNT(*) AS c FROM proveedores WHERE activo = 1"
        )

        # --- Inventario: ingredientes por debajo del stock mínimo ---
        ingredientes_bajo_stock = _scalar(
            cursor,
            "SELECT COUNT(*) AS c FROM ingredientes WHERE stock_actual <= stock_minimo",
        )

        # --- Órdenes ---
        ordenes_totales = _scalar(cursor, "SELECT COUNT(*) AS c FROM ordenes")

        cursor.execute("SELECT estado, COUNT(*) AS c FROM ordenes GROUP BY estado")
        ordenes_por_estado = {r["estado"]: r["c"] for r in cursor.fetchall()}

        # --- Reservas de hoy ---
        reservas_hoy = _scalar(
            cursor,
            "SELECT COUNT(*) AS c FROM reservas WHERE DATE(fecha_reserva) = CURDATE()",
        )

        # --- Ventas (basadas en facturas) ---
        ventas_hoy = _scalar(
            cursor,
            "SELECT COALESCE(SUM(total), 0) AS c FROM facturas WHERE DATE(fecha_emision) = CURDATE()",
        )
        ventas_mes = _scalar(
            cursor,
            """
            SELECT COALESCE(SUM(total), 0) AS c
              FROM facturas
             WHERE YEAR(fecha_emision) = YEAR(CURDATE())
               AND MONTH(fecha_emision) = MONTH(CURDATE())
            """,
        )
        facturas_mes = _scalar(
            cursor,
            """
            SELECT COUNT(*) AS c
              FROM facturas
             WHERE YEAR(fecha_emision) = YEAR(CURDATE())
               AND MONTH(fecha_emision) = MONTH(CURDATE())
            """,
        )

        cursor.close()
        conn.close()

        return ResumenDashboard(
            total_usuarios=total_usuarios,
            usuarios_activos=usuarios_activos,
            total_clientes=total_clientes,
            total_productos=total_productos,
            productos_disponibles=productos_disponibles,
            total_mesas=total_mesas,
            mesas_activas=mesas_activas,
            total_proveedores=total_proveedores,
            proveedores_activos=proveedores_activos,
            ingredientes_bajo_stock=ingredientes_bajo_stock,
            ordenes_totales=ordenes_totales,
            ordenes_por_estado=ordenes_por_estado,
            reservas_hoy=reservas_hoy,
            ventas_hoy=float(ventas_hoy),
            ventas_mes=float(ventas_mes),
            facturas_mes=facturas_mes,
        )

    except mysql.connector.Error as e:
        raise HTTPException(status_code=400, detail=f"Error al obtener el resumen del dashboard: {str(e)}")
