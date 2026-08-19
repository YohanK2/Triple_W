from typing import Optional, Dict, Any

from passlib.context import CryptContext
from datetime import datetime, timedelta, UTC
from app.core.configuracion import CLAVE_SECRETA, ALGORITMO, MINUTOS_EXPIRACION_TOKEN
from jose import jwt


contexto = CryptContext(schemes=["bcrypt"], deprecated="auto")


def encriptar_contrasena(contrasena: str) -> str:
    return contexto.hash(contrasena)


def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
    if not hash_guardado or not contrasena:
        return False
    try:
        # 1. Intento estándar de verificación con Bcrypt
        return contexto.verify(contrasena, hash_guardado)
    except Exception:
        # 2. Fallback de compatibilidad: si en la BD se guardó en texto plano (ej. "123456")
        return contrasena == hash_guardado


# Alias compatible with auth.py naming
verify_password = verificar_contrasena


def _construir_token(payload: Dict[str, Any], minutos: Optional[int] = None) -> str:
    ahora = datetime.now(UTC)
    expira = ahora + timedelta(minutes=minutos or MINUTOS_EXPIRACION_TOKEN)
    token_data = payload.copy()
    token_data["exp"] = expira
    token_data["iat"] = ahora
    return jwt.encode(token_data, CLAVE_SECRETA, algorithm=ALGORITMO)


def crear_token_acceso(nombre_username: str, id_usuario: int, minutos: Optional[int] = None) -> str:
    return _construir_token({"sub": nombre_username, "uid": id_usuario}, minutos)


def create_access_token(payload: Dict[str, Any], minutos: Optional[int] = None) -> str:
    return _construir_token(payload, minutos)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
    except Exception:
        return None