from typing import Optional
from pydantic import BaseModel


class Turno(BaseModel):
    id_turno: Optional[int] = None
    id_empleado: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    observaciones: Optional[str] = None
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
