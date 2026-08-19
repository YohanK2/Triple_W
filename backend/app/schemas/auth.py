from pydantic import BaseModel


class LoginRequest(BaseModel):
    nombre_usuario: str
    contrasena: str


class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre_usuario: str
    nombres: str
    apellidos: str
    correo: str
    id_rol: int
    rol_nombre: str


class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse
