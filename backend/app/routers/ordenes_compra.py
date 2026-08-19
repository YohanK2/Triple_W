from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.ordenes_compra import OrdenCompra

router = APIRouter(prefix="/ordenes_compra", tags=["orden de compra"])


@router.get("/", response_model=List[OrdenCompra])
def listar_ordenes_compra():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_orden_compra, id_proveedor, id_usuario, fecha, total, estado, actualizado_por FROM ordenes_compra"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[OrdenCompra] = []
    for r in rows:
        item = OrdenCompra(
            id_orden_compra=r["id_orden_compra"],
            id_proveedor=r["id_proveedor"],
            id_usuario=r["id_usuario"],
            fecha=str(r["fecha"]) if r["fecha"] is not None else None,
            total=float(r["total"]) if r["total"] is not None else None,
            estado=r["estado"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_ordenes_compra(p: OrdenCompra):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO ordenes_compra (id_proveedor, id_usuario, fecha, total, estado, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_proveedor, p.id_usuario, p.fecha, p.total, p.estado, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "OrdenCompra creada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear ordenes_compra: {str(e)}")


@router.get("/{id_orden_compra}", response_model=OrdenCompra)
def obtener_ordenes_compra(id_orden_compra: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_orden_compra, id_proveedor, id_usuario, fecha, total, estado, actualizado_por FROM ordenes_compra WHERE id_orden_compra = %s"
    cur.execute(sql, (id_orden_compra,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="OrdenCompra no encontrada")

    item = OrdenCompra(
        id_orden_compra=r["id_orden_compra"],
        id_proveedor=r["id_proveedor"],
        id_usuario=r["id_usuario"],
        fecha=str(r["fecha"]) if r["fecha"] is not None else None,
        total=float(r["total"]) if r["total"] is not None else None,
        estado=r["estado"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_orden_compra}")
def actualizar_ordenes_compra(id_orden_compra: int, p: OrdenCompra):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE ordenes_compra
               SET id_proveedor = %s,
                   id_usuario = %s,
                   fecha = %s,
                   total = %s,
                   estado = %s,
                   actualizado_por = %s
             WHERE id_orden_compra = %s
        """
        cur.execute(sql, (p.id_proveedor, p.id_usuario, p.fecha, p.total, p.estado, p.actualizado_por, id_orden_compra))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "OrdenCompra actualizada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar ordenes_compra: {str(e)}")


@router.delete("/{id_orden_compra}")
async def eliminar_ordenes_compra(id_orden_compra: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM ordenes_compra WHERE id_orden_compra = %s"
        cur.execute(sql, (id_orden_compra,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "OrdenCompra eliminada con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar ordenes_compra: {str(e)}")
