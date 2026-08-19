from typing import Dict, Optional
from pydantic import BaseModel


class ResumenDashboard(BaseModel):
    total_usuarios: int
    usuarios_activos: int
    total_clientes: int
    total_productos: int
    productos_disponibles: int
    total_mesas: int
    mesas_activas: int
    total_proveedores: int
    proveedores_activos: int
    ingredientes_bajo_stock: int
    ordenes_totales: int
    ordenes_por_estado: Dict[str, int]
    reservas_hoy: int
    ventas_hoy: float
    ventas_mes: float
    facturas_mes: int
