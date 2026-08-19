from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.notificaciones import Notificacion

router = APIRouter(prefix="/notificaciones", tags=["notificaiones"])

@router.get("/", response_model=List[Notificacion])
def listar_notificaciones():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_notificacion, id_usuario, titulo, mensaje, tipo, leida, creado_en FROM notificaciones"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Notificacion] = []
    for r in rows:
        item = Notificacion(
            id_notificacion=r["id_notificacion"],
            id_usuario=r["id_usuario"],
            titulo=r["titulo"],
            mensaje=r["mensaje"],
            tipo=r["tipo"],
            leida=bool(r["leida"]),
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_notificaciones(p: Notificacion):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, leida) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_usuario, p.titulo, p.mensaje, p.tipo, int(p.leida)))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Notificacion creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear notificaciones: {str(e)}")


@router.get("/{id_notificacion}", response_model=Notificacion)
def obtener_notificaciones(id_notificacion: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_notificacion, id_usuario, titulo, mensaje, tipo, leida, creado_en FROM notificaciones WHERE id_notificacion = %s"
    cur.execute(sql, (id_notificacion,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Notificacion no encontrado")

    item = Notificacion(
        id_notificacion=r["id_notificacion"],
        id_usuario=r["id_usuario"],
        titulo=r["titulo"],
        mensaje=r["mensaje"],
        tipo=r["tipo"],
        leida=bool(r["leida"]),
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
    )
    return item


@router.put("/{id_notificacion}")
def actualizar_notificaciones(id_notificacion: int, p: Notificacion):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE notificaciones
               SET id_usuario = %s,
                   titulo = %s,
                   mensaje = %s,
                   tipo = %s,
                   leida = %s
             WHERE id_notificacion = %s
        """
        cur.execute(sql, (p.id_usuario, p.titulo, p.mensaje, p.tipo, int(p.leida), id_notificacion))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Notificacion actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar notificaciones: {str(e)}")


@router.delete("/{id_notificacion}")
async def eliminar_notificaciones(id_notificacion: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM notificaciones WHERE id_notificacion = %s"
        cur.execute(sql, (id_notificacion,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Notificacion eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar notificaciones: {str(e)}")
