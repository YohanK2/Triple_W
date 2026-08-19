from typing import Optional
from pydantic import BaseModel


class Proveedor(BaseModel):
    id_proveedor: Optional[int] = None
    empresa: str
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[str] = None
    direccion: Optional[str] = None
    activo: bool
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
