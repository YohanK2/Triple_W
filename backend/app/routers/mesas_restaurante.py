from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.mesas_restaurante import Mesa

router = APIRouter(prefix="/mesas_restaurante", tags=["mesas"])

@router.get("/", response_model=List[Mesa])
def listar_mesas_restaurante():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_mesa, numero_mesa, capacidad, ubicacion, activa, creado_por, actualizado_por FROM mesas_restaurante"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Mesa] = []
    for r in rows:
        item = Mesa(
            id_mesa=r["id_mesa"],
            numero_mesa=r["numero_mesa"],
            capacidad=r["capacidad"],
            ubicacion=r["ubicacion"],
            activa=bool(r["activa"]),
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_mesas_restaurante(p: Mesa):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO mesas_restaurante (numero_mesa, capacidad, ubicacion, activa, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.numero_mesa, p.capacidad, p.ubicacion, int(p.activa), p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Mesa creada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear mesas_restaurante: {str(e)}")


@router.get("/{id_mesa}", response_model=Mesa)
def obtener_mesas_restaurante(id_mesa: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_mesa, numero_mesa, capacidad, ubicacion, activa, creado_por, actualizado_por FROM mesas_restaurante WHERE id_mesa = %s"
    cur.execute(sql, (id_mesa,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Mesa no encontrada")

    item = Mesa(
        id_mesa=r["id_mesa"],
        numero_mesa=r["numero_mesa"],
        capacidad=r["capacidad"],
        ubicacion=r["ubicacion"],
        activa=bool(r["activa"]),
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_mesa}")
def actualizar_mesas_restaurante(id_mesa: int, p: Mesa):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE mesas_restaurante
               SET numero_mesa = %s,
                   capacidad = %s,
                   ubicacion = %s,
                   activa = %s,
                   actualizado_por = %s
             WHERE id_mesa = %s
        """
        cur.execute(sql, (p.numero_mesa, p.capacidad, p.ubicacion, int(p.activa), p.actualizado_por, id_mesa))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Mesa actualizada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar mesas_restaurante: {str(e)}")


@router.delete("/{id_mesa}")
async def eliminar_mesas_restaurante(id_mesa: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM mesas_restaurante WHERE id_mesa = %s"
        cur.execute(sql, (id_mesa,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Mesa eliminada con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar mesas_restaurante: {str(e)}")
