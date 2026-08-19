from typing import Optional
from pydantic import BaseModel


class Notificacion(BaseModel):
    id_notificacion: Optional[int] = None
    id_usuario: int
    titulo: str
    mensaje: str
    tipo: str
    leida: bool
    creado_en: Optional[str] = None
