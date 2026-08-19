from typing import Optional
from pydantic import BaseModel


class ItemOrdenCompra(BaseModel):
    id_detalle: Optional[int] = None
    id_orden_compra: int
    id_ingrediente: int
    cantidad: float
    costo_unitario: float
    subtotal: float
