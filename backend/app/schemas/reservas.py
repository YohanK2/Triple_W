from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Reservas(BaseModel):
    id_reserva: Optional[int] = None
    id_cliente: Optional[int] = None
    id_mesa: Optional[int] = None
    fecha_reserva: datetime
    tamano_grupo: Optional[int] = None
    estado: Optional[str] = None
    notas: Optional[str] = None
    creado_por: Optional[int] = None
    actualizado_por: Optional[int] = None
