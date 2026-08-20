from typing import Optional
from pydantic import BaseModel


class ItemOrden(BaseModel):
    id_item_orden: Optional[int] = None
    id_orden: int
    id_item_menu: int
    cantidad: int
    precio_unitario: float
    subtotal: float
    instrucciones_especiales: Optional[str] = None


class ItemOrdenDetalle(BaseModel):
    id_item_orden: Optional[int] = None
    id_orden: int
    id_item_menu: int
    cantidad: int
    precio_unitario: Optional[float] = None
    subtotal: Optional[float] = None
    instrucciones_especiales: Optional[str] = None
    nombre: Optional[str] = None
