from typing import Optional
from pydantic import BaseModel


class EstadoMesa(BaseModel):
    id_estado: Optional[int] = None
    id_mesa: int
    estado: str
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
    actualizado_en: Optional[str] = None
