from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.core.security import encriptar_contrasena
from app.schemas.usuarios import Usuario


def _normalizar_hash_contrasena(valor: str) -> str:
    if valor and valor.startswith("$2"):
        return valor
    return encriptar_contrasena(valor)

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

USUARIO_COLUMNS = (
    "id_usuario, nombre_usuario, hash_contrasena, nombres, apellidos, "
    "correo, telefono, id_rol, activo, cargo, salario, fecha_contratacion, "
    "contacto_emergencia, telefono_emergencia, estado, "
    "creado_por, actualizado_por, creado_en, actualizado_en"
)


@router.get("/", response_model=List[Usuario])
def listar_usuarios():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = f"SELECT {USUARIO_COLUMNS} FROM usuarios"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Usuario] = []
    for r in rows:
        item = Usuario(
            id_usuario=r["id_usuario"],
            nombre_usuario=r["nombre_usuario"],
            hash_contrasena=r["hash_contrasena"],
            nombres=r["nombres"],
            apellidos=r["apellidos"],
            correo=r["correo"],
            telefono=r["telefono"],
            id_rol=r["id_rol"],
            activo=bool(r["activo"]),
            cargo=r["cargo"],
            salario=float(r["salario"]) if r["salario"] is not None else None,
            fecha_contratacion=str(r["fecha_contratacion"]) if r["fecha_contratacion"] is not None else None,
            contacto_emergencia=r["contacto_emergencia"],
            telefono_emergencia=r["telefono_emergencia"],
            estado=r["estado"],
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
            actualizado_en=str(r["actualizado_en"]) if r["actualizado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_usuarios(p: Usuario):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = """
            INSERT INTO usuarios
                (nombre_usuario, hash_contrasena, nombres, apellidos, correo, telefono,
                 id_rol, activo, cargo, salario, fecha_contratacion,
                 contacto_emergencia, telefono_emergencia, estado,
                 creado_por, actualizado_por)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cur.execute(sql, (
            p.nombre_usuario, _normalizar_hash_contrasena(p.hash_contrasena), p.nombres, p.apellidos,
            p.correo, p.telefono, p.id_rol, int(p.activo),
            p.cargo, p.salario, p.fecha_contratacion,
            p.contacto_emergencia, p.telefono_emergencia, p.estado,
            p.creado_por, p.actualizado_por,
        ))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Usuario creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear usuarios: {str(e)}")


@router.get("/{id_usuario}", response_model=Usuario)
def obtener_usuarios(id_usuario: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = f"SELECT {USUARIO_COLUMNS} FROM usuarios WHERE id_usuario = %s"
    cur.execute(sql, (id_usuario,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    item = Usuario(
        id_usuario=r["id_usuario"],
        nombre_usuario=r["nombre_usuario"],
        hash_contrasena=r["hash_contrasena"],
        nombres=r["nombres"],
        apellidos=r["apellidos"],
        correo=r["correo"],
        telefono=r["telefono"],
        id_rol=r["id_rol"],
        activo=bool(r["activo"]),
        cargo=r["cargo"],
        salario=float(r["salario"]) if r["salario"] is not None else None,
        fecha_contratacion=str(r["fecha_contratacion"]) if r["fecha_contratacion"] is not None else None,
        contacto_emergencia=r["contacto_emergencia"],
        telefono_emergencia=r["telefono_emergencia"],
        estado=r["estado"],
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        actualizado_en=str(r["actualizado_en"]) if r["actualizado_en"] is not None else None,
    )
    return item


@router.put("/{id_usuario}")
def actualizar_usuarios(id_usuario: int, p: Usuario):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE usuarios
               SET nombre_usuario = %s,
                   hash_contrasena = %s,
                   nombres = %s,
                   apellidos = %s,
                   correo = %s,
                   telefono = %s,
                   id_rol = %s,
                   activo = %s,
                   cargo = %s,
                   salario = %s,
                   fecha_contratacion = %s,
                   contacto_emergencia = %s,
                   telefono_emergencia = %s,
                   estado = %s,
                   actualizado_por = %s
             WHERE id_usuario = %s
        """
        cur.execute(sql, (
            p.nombre_usuario, _normalizar_hash_contrasena(p.hash_contrasena), p.nombres, p.apellidos,
            p.correo, p.telefono, p.id_rol, int(p.activo),
            p.cargo, p.salario, p.fecha_contratacion,
            p.contacto_emergencia, p.telefono_emergencia, p.estado,
            p.actualizado_por, id_usuario,
        ))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Usuario actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar usuarios: {str(e)}")


@router.delete("/{id_usuario}")
async def eliminar_usuarios(id_usuario: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM usuarios WHERE id_usuario = %s"
        cur.execute(sql, (id_usuario,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Usuario eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar usuarios: {str(e)}")
