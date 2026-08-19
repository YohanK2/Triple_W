from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.roles import Rol

router = APIRouter(prefix="/roles", tags=["roles"])

@router.get("/", response_model=List[Rol])
def listar_roles():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_rol, nombre, descripcion, estado, salario, creado_por, actualizado_por, creado_en FROM roles"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Rol] = []
    for r in rows:
        item = Rol(
            id_rol=r["id_rol"],
            nombre=r["nombre"],
            descripcion=r["descripcion"],
            estado=bool(r["estado"]),
            salario=float(r["salario"]) if r["salario"] is not None else None,
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_roles(p: Rol):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO roles (nombre, descripcion, estado, salario, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.nombre, p.descripcion, int(p.estado), p.salario, p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Rol creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear roles: {str(e)}")


@router.get("/{id_rol}", response_model=Rol)
def obtener_roles(id_rol: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_rol, nombre, descripcion, estado, salario, creado_por, actualizado_por, creado_en FROM roles WHERE id_rol = %s"
    cur.execute(sql, (id_rol,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    item = Rol(
        id_rol=r["id_rol"],
        nombre=r["nombre"],
        descripcion=r["descripcion"],
        estado=bool(r["estado"]),
        salario=float(r["salario"]) if r["salario"] is not None else None,
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
    )
    return item


@router.put("/{id_rol}")
def actualizar_roles(id_rol: int, p: Rol):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE roles
               SET nombre = %s,
                   descripcion = %s,
                   estado = %s,
                   salario = %s,
                   actualizado_por = %s
             WHERE id_rol = %s
        """
        cur.execute(sql, (p.nombre, p.descripcion, int(p.estado), p.salario, p.actualizado_por, id_rol))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Rol actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar roles: {str(e)}")


@router.delete("/{id_rol}")
async def eliminar_roles(id_rol: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM roles WHERE id_rol = %s"
        cur.execute(sql, (id_rol,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Rol eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar roles: {str(e)}")
