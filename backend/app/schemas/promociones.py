from typing import Optional
from pydantic import BaseModel


class Promocion(BaseModel):
    id_promocion: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    porcentaje_descuento: float
    fecha_inicio: str
    fecha_fin: str
    activa: bool
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
