from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.conexion import get_conn
from app.core.security import decode_access_token

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Token inválido")

    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT id_usuario, nombre_usuario, nombres, apellidos, correo, id_rol, activo "
        "FROM usuarios WHERE id_usuario = %s",
        (int(user_id),),
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user or not user["activo"]:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o desactivado")

    return user
