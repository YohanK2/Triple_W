from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SesionCaja(BaseModel):
    id_sesion: Optional[int] = None
    id_usuario: int
    fecha_apertura: Optional[datetime] = None
    fondo_inicial: float
    fecha_cierre: Optional[datetime] = None
    efectivo_contado: Optional[float] = None
    efectivo_esperado: Optional[float] = None
    diferencia: Optional[float] = None
    estado: str = 'abierta'
    observaciones: Optional[str] = None


class AperturaCaja(BaseModel):
    id_usuario: int
    fondo_inicial: float


class CierreCaja(BaseModel):
    efectivo_contado: float
    efectivo_esperado: float
    diferencia: float
    observaciones: Optional[str] = None


class MovimientoCaja(BaseModel):
    id_movimiento: Optional[int] = None
    id_sesion: int
    tipo: str
    concepto: str
    monto: float
    creado_por: int
    creado_en: Optional[datetime] = None


class NuevoMovimientoCaja(BaseModel):
    tipo: str
    concepto: str
    monto: float
    creado_por: int
