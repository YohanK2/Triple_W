from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.estado_mesas import EstadoMesa

router = APIRouter(prefix="/estado_mesas", tags=["estado de mesas"])

@router.get("/", response_model=List[EstadoMesa])
def listar_estado_mesas():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_estado, id_mesa, estado, creado_por, actualizado_por, actualizado_en FROM estado_mesas"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[EstadoMesa] = []
    for r in rows:
        item = EstadoMesa(
            id_estado=r["id_estado"],
            id_mesa=r["id_mesa"],
            estado=r["estado"],
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
            actualizado_en=str(r["actualizado_en"]) if r["actualizado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_estado_mesas(p: EstadoMesa):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO estado_mesas (id_mesa, estado, creado_por, actualizado_por) VALUES (%s, %s, %s, %s)"
        cur.execute(sql, (p.id_mesa, p.estado, p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "EstadoMesa creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear estado_mesas: {str(e)}")


@router.get("/{id_estado}", response_model=EstadoMesa)
def obtener_estado_mesas(id_estado: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_estado, id_mesa, estado, creado_por, actualizado_por, actualizado_en FROM estado_mesas WHERE id_estado = %s"
    cur.execute(sql, (id_estado,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="EstadoMesa no encontrado")

    item = EstadoMesa(
        id_estado=r["id_estado"],
        id_mesa=r["id_mesa"],
        estado=r["estado"],
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
        actualizado_en=str(r["actualizado_en"]) if r["actualizado_en"] is not None else None,
    )
    return item


@router.put("/{id_estado}")
def actualizar_estado_mesas(id_estado: int, p: EstadoMesa):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE estado_mesas
               SET id_mesa = %s,
                   estado = %s,
                   actualizado_por = %s
             WHERE id_estado = %s
        """
        cur.execute(sql, (p.id_mesa, p.estado, p.actualizado_por, id_estado))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "EstadoMesa actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar estado_mesas: {str(e)}")


@router.delete("/{id_estado}")
async def eliminar_estado_mesas(id_estado: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM estado_mesas WHERE id_estado = %s"
        cur.execute(sql, (id_estado,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "EstadoMesa eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar estado_mesas: {str(e)}")
