from typing import Optional
from pydantic import BaseModel


class PromocionOrden(BaseModel):
    id_promocion_orden: Optional[int] = None
    id_orden: int
    id_promocion: int
    descuento_aplicado: float
    creado_por: Optional[int] = None
