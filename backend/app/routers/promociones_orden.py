from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.promociones_orden import PromocionOrden

router = APIRouter(prefix="/promociones_orden", tags=["promociones orden"])


@router.get("/", response_model=List[PromocionOrden])
def listar_promociones_orden():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_promocion_orden, id_orden, id_promocion, descuento_aplicado, creado_por FROM promociones_orden"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[PromocionOrden] = []
    for r in rows:
        item = PromocionOrden(
            id_promocion_orden=r["id_promocion_orden"],
            id_orden=r["id_orden"],
            id_promocion=r["id_promocion"],
            descuento_aplicado=float(r["descuento_aplicado"]) if r["descuento_aplicado"] is not None else None,
            creado_por=r["creado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_promociones_orden(p: PromocionOrden):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO promociones_orden (id_orden, id_promocion, descuento_aplicado, creado_por) VALUES (%s, %s, %s, %s)"
        cur.execute(sql, (p.id_orden, p.id_promocion, p.descuento_aplicado, p.creado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "PromocionOrden creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear promociones_orden: {str(e)}")


@router.get("/{id_promocion_orden}", response_model=PromocionOrden)
def obtener_promociones_orden(id_promocion_orden: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_promocion_orden, id_orden, id_promocion, descuento_aplicado, creado_por FROM promociones_orden WHERE id_promocion_orden = %s"
    cur.execute(sql, (id_promocion_orden,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="PromocionOrden no encontrado")

    item = PromocionOrden(
        id_promocion_orden=r["id_promocion_orden"],
        id_orden=r["id_orden"],
        id_promocion=r["id_promocion"],
        descuento_aplicado=float(r["descuento_aplicado"]) if r["descuento_aplicado"] is not None else None,
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_promocion_orden}")
def actualizar_promociones_orden(id_promocion_orden: int, p: PromocionOrden):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE promociones_orden
               SET id_orden = %s,
                   id_promocion = %s,
                   descuento_aplicado = %s
             WHERE id_promocion_orden = %s
        """
        cur.execute(sql, (p.id_orden, p.id_promocion, p.descuento_aplicado, id_promocion_orden))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "PromocionOrden actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar promociones_orden: {str(e)}")


@router.delete("/{id_promocion_orden}")
async def eliminar_promociones_orden(id_promocion_orden: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM promociones_orden WHERE id_promocion_orden = %s"
        cur.execute(sql, (id_promocion_orden,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "PromocionOrden eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar promociones_orden: {str(e)}")
