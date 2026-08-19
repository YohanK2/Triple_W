from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.registros_estados import RegistroEstado

router = APIRouter(prefix="/registros_estados", tags=["registro estados"])

@router.get("/", response_model=List[RegistroEstado])
def listar_registros_estados():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_registro, id_orden, id_estado_anterior, id_estado_nuevo, cambiado_por, notas, creado_en FROM registros_estados"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[RegistroEstado] = []
    for r in rows:
        item = RegistroEstado(
            id_registro=r["id_registro"],
            id_orden=r["id_orden"],
            id_estado_anterior=r["id_estado_anterior"],
            id_estado_nuevo=r["id_estado_nuevo"],
            cambiado_por=r["cambiado_por"],
            notas=r["notas"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_registros_estados(p: RegistroEstado):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO registros_estados (id_orden, id_estado_anterior, id_estado_nuevo, cambiado_por, notas) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_orden, p.id_estado_anterior, p.id_estado_nuevo, p.cambiado_por, p.notas))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "RegistroEstado creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear registros_estados: {str(e)}")


@router.get("/{id_registro}", response_model=RegistroEstado)
def obtener_registros_estados(id_registro: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_registro, id_orden, id_estado_anterior, id_estado_nuevo, cambiado_por, notas, creado_en FROM registros_estados WHERE id_registro = %s"
    cur.execute(sql, (id_registro,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="RegistroEstado no encontrado")

    item = RegistroEstado(
        id_registro=r["id_registro"],
        id_orden=r["id_orden"],
        id_estado_anterior=r["id_estado_anterior"],
        id_estado_nuevo=r["id_estado_nuevo"],
        cambiado_por=r["cambiado_por"],
        notas=r["notas"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
    )
    return item


@router.put("/{id_registro}")
def actualizar_registros_estados(id_registro: int, p: RegistroEstado):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE registros_estados
               SET id_orden = %s,
                   id_estado_anterior = %s,
                   id_estado_nuevo = %s,
                   cambiado_por = %s,
                   notas = %s
             WHERE id_registro = %s
        """
        cur.execute(sql, (p.id_orden, p.id_estado_anterior, p.id_estado_nuevo, p.cambiado_por, p.notas, id_registro))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "RegistroEstado actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar registros_estados: {str(e)}")


@router.delete("/{id_registro}")
async def eliminar_registros_estados(id_registro: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM registros_estados WHERE id_registro = %s"
        cur.execute(sql, (id_registro,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "RegistroEstado eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar registros_estados: {str(e)}")
