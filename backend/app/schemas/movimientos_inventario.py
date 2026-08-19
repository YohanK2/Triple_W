from typing import Optional
from pydantic import BaseModel


class MovimientoInventario(BaseModel):
    id_movimiento: Optional[int] = None
    id_ingrediente: int
    tipo_movimiento: str
    cantidad: float
    motivo: Optional[str] = None
    id_usuario: int
    creado_en: Optional[str] = None
