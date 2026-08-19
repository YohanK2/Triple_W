from typing import Optional
from pydantic import BaseModel


class Mesa(BaseModel):
    id_mesa: Optional[int] = None
    numero_mesa: int
    capacidad: int
    ubicacion: Optional[str] = None
    activa: bool
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
