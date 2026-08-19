from typing import Optional
from pydantic import BaseModel


class Orden(BaseModel):
    id_orden: Optional[int] = None
    id_cliente: Optional[int] = None
    id_mesa: int
    id_mesero: int
    subtotal: float
    impuesto: float
    total: float
    estado: str
    notas: Optional[str] = None
    creado_en: Optional[str] = None
    actualizado_en: Optional[str] = None
