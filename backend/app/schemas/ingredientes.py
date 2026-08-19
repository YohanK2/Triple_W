from typing import Optional
from pydantic import BaseModel


class Ingrediente(BaseModel):
    id_ingrediente: Optional[int] = None
    nombre: str
    descripcion: Optional[str] = None
    unidad_medida: str
    stock_actual: float
    stock_minimo: float
    activo: bool
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
