from typing import Optional
from pydantic import BaseModel


class ItemMenu(BaseModel):
    id_item_menu: Optional[int] = None
    id_categoria: int
    nombre: str
    descripcion: Optional[str] = None
    precio: float
    imagen: Optional[str] = None
    disponible: bool
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
    creado_en: Optional[str] = None
