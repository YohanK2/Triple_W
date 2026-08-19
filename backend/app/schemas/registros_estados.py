from typing import Optional
from pydantic import BaseModel


class RegistroEstado(BaseModel):
    id_registro: Optional[int] = None
    id_orden: int
    id_estado_anterior: Optional[int] = None
    id_estado_nuevo: int
    cambiado_por: int
    notas: Optional[str] = None
    creado_en: Optional[str] = None
