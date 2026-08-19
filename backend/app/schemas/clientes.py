from typing import Optional
from pydantic import BaseModel


class Cliente(BaseModel):
    id_cliente: Optional[int] = None
    nombre: str
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    puntos_fidelidad: int
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
    creado_en: Optional[str] = None
