from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.ordenes import Orden

router = APIRouter(prefix="/ordenes", tags=["ordenes"])

@router.get("/", response_model=List[Orden])
def listar_ordenes():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_orden, id_cliente, id_mesa, id_mesero, subtotal, impuesto, total, estado, notas, creado_en, actualizado_en FROM ordenes"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Orden] = []
    for r in rows:
        item = Orden(
            id_orden=r["id_orden"],
            id_cliente=r["id_cliente"],
            id_mesa=r["id_mesa"],
            id_mesero=r["id_mesero"],
            subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
            impuesto=float(r["impuesto"]) if r["impuesto"] is not None else None,
            total=float(r["total"]) if r["total"] is not None else None,
            estado=r["estado"],
            notas=r["notas"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
            actualizado_en=str(r["actualizado_en"]) if r["actualizado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_ordenes(p: Orden):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO ordenes (id_cliente, id_mesa, id_mesero, subtotal, impuesto, total, estado, notas) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_cliente, p.id_mesa, p.id_mesero, p.subtotal, p.impuesto, p.total, p.estado, p.notas))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Orden creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear ordenes: {str(e)}")


@router.get("/{id_orden}", response_model=Orden)
def obtener_ordenes(id_orden: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_orden, id_cliente, id_mesa, id_mesero, subtotal, impuesto, total, estado, notas, creado_en, actualizado_en FROM ordenes WHERE id_orden = %s"
    cur.execute(sql, (id_orden,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Orden no encontrado")

    item = Orden(
        id_orden=r["id_orden"],
        id_cliente=r["id_cliente"],
        id_mesa=r["id_mesa"],
        id_mesero=r["id_mesero"],
        subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
        impuesto=float(r["impuesto"]) if r["impuesto"] is not None else None,
        total=float(r["total"]) if r["total"] is not None else None,
        estado=r["estado"],
        notas=r["notas"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        actualizado_en=str(r["actualizado_en"]) if r["actualizado_en"] is not None else None,
    )
    return item


@router.put("/{id_orden}")
def actualizar_ordenes(id_orden: int, p: Orden):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE ordenes
               SET id_cliente = %s,
                   id_mesa = %s,
                   id_mesero = %s,
                   subtotal = %s,
                   impuesto = %s,
                   total = %s,
                   estado = %s,
                   notas = %s
             WHERE id_orden = %s
        """
        cur.execute(sql, (p.id_cliente, p.id_mesa, p.id_mesero, p.subtotal, p.impuesto, p.total, p.estado, p.notas, id_orden))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Orden actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar ordenes: {str(e)}")


@router.delete("/{id_orden}")
async def eliminar_ordenes(id_orden: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM ordenes WHERE id_orden = %s"
        cur.execute(sql, (id_orden,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Orden eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar ordenes: {str(e)}")
