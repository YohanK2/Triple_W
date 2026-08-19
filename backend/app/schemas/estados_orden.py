from typing import Optional
from pydantic import BaseModel


class EstadoOrden(BaseModel):
    id_estado: Optional[int] = None
    nombre_estado: str
    descripcion: Optional[str] = None
