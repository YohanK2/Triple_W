from typing import Optional
from pydantic import BaseModel


class Factura(BaseModel):
    id_factura: Optional[int] = None
    id_orden: int
    numero_factura: str
    subtotal: float
    impuesto: float
    total: float
    metodo_pago: Optional[str] = None
    numero_referencia: Optional[str] = None
    creado_por: Optional[int] = None
    fecha_emision: Optional[str] = None
