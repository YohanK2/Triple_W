from typing import Optional
from pydantic import BaseModel


class CategoriaMenu(BaseModel):
    id_categoria: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    activo: bool
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
