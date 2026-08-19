from typing import Optional
from pydantic import BaseModel


class Asistencia(BaseModel):
    id_asistencia: Optional[int] = None
    id_empleado: int
    id_turno: Optional[int] = None
    hora_entrada: str
    hora_salida: Optional[str] = None
    horas_trabajadas: Optional[float] = None
