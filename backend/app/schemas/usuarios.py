from typing import Optional
from pydantic import BaseModel


class Usuario(BaseModel):
    id_usuario: Optional[int] = None
    nombre_usuario: str
    contrasena: str
    nombres: str
    apellidos: str
    correo: str
    telefono: str
    id_rol: int
    activo: bool
    cargo: Optional[str] = None
    salario: Optional[float] = None
    fecha_contratacion: Optional[str] = None
    contacto_emergencia: Optional[str] = None
    telefono_emergencia: Optional[str] = None
    estado: Optional[str] = None
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
    creado_en: Optional[str] = None
    actualizado_en: Optional[str] = None
