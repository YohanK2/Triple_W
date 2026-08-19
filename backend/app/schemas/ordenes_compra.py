from typing import Optional
from pydantic import BaseModel


class OrdenCompra(BaseModel):
    id_orden_compra: Optional[int] = None
    id_proveedor: int
    id_usuario: int
    fecha: str
    total: float
    estado: str
    actualizado_por: Optional[int] = None
