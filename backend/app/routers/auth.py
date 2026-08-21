from fastapi import APIRouter, HTTPException

from app.core.conexion import get_conn
from app.core.security import verify_password, create_access_token
from app.schemas.auth import LoginRequest, LoginResponse, UsuarioResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(p: LoginRequest):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute(
        "SELECT id_usuario, nombre_usuario, contrasena, nombres, apellidos, "
        "correo, id_rol, activo "
        "FROM usuarios WHERE nombre_usuario = %s",
        (p.nombre_usuario,),
    )
    user = cur.fetchone()

    if not user:
        cur.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    if not user["activo"]:
        cur.close()
        conn.close()
        raise HTTPException(status_code=403, detail="Usuario desactivado")

    if not verify_password(p.contrasena, user["contrasena"]):
        cur.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    cur.execute("SELECT nombre FROM roles WHERE id_rol = %s", (user["id_rol"],))
    rol = cur.fetchone()
    rol_nombre = rol["nombre"] if rol else "Sin rol"

    cur.close()
    conn.close()

    token = create_access_token({
        "sub": str(user["id_usuario"]),
        "rol": rol_nombre,
    })

    usuario = UsuarioResponse(
        id_usuario=user["id_usuario"],
        nombre_usuario=user["nombre_usuario"],
        nombres=user["nombres"],
        apellidos=user["apellidos"],
        correo=user["correo"],
        id_rol=user["id_rol"],
        rol_nombre=rol_nombre,
    )

    return LoginResponse(token=token, usuario=usuario)
