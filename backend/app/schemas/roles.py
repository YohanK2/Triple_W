from typing import Optional
from pydantic import BaseModel


class Rol(BaseModel):
    id_rol: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    estado: bool
    salario: Optional[float] = None
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
    creado_en: Optional[str] = None
