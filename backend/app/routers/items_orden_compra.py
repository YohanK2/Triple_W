from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.items_orden_compra import ItemOrdenCompra

router = APIRouter(prefix="/items_orden_compra", tags=["orden compra"])

@router.get("/", response_model=List[ItemOrdenCompra])
def listar_items_orden_compra():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_detalle, id_orden_compra, id_ingrediente, cantidad, costo_unitario, subtotal FROM items_orden_compra"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[ItemOrdenCompra] = []
    for r in rows:
        item = ItemOrdenCompra(
            id_detalle=r["id_detalle"],
            id_orden_compra=r["id_orden_compra"],
            id_ingrediente=r["id_ingrediente"],
            cantidad=float(r["cantidad"]) if r["cantidad"] is not None else None,
            costo_unitario=float(r["costo_unitario"]) if r["costo_unitario"] is not None else None,
            subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_items_orden_compra(p: ItemOrdenCompra):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO items_orden_compra (id_orden_compra, id_ingrediente, cantidad, costo_unitario, subtotal) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_orden_compra, p.id_ingrediente, p.cantidad, p.costo_unitario, p.subtotal))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "ItemOrdenCompra creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear items_orden_compra: {str(e)}")


@router.get("/{id_detalle}", response_model=ItemOrdenCompra)
def obtener_items_orden_compra(id_detalle: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_detalle, id_orden_compra, id_ingrediente, cantidad, costo_unitario, subtotal FROM items_orden_compra WHERE id_detalle = %s"
    cur.execute(sql, (id_detalle,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="ItemOrdenCompra no encontrado")

    item = ItemOrdenCompra(
        id_detalle=r["id_detalle"],
        id_orden_compra=r["id_orden_compra"],
        id_ingrediente=r["id_ingrediente"],
        cantidad=float(r["cantidad"]) if r["cantidad"] is not None else None,
        costo_unitario=float(r["costo_unitario"]) if r["costo_unitario"] is not None else None,
        subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
    )
    return item


@router.put("/{id_detalle}")
def actualizar_items_orden_compra(id_detalle: int, p: ItemOrdenCompra):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE items_orden_compra
               SET id_orden_compra = %s,
                   id_ingrediente = %s,
                   cantidad = %s,
                   costo_unitario = %s,
                   subtotal = %s
             WHERE id_detalle = %s
        """
        cur.execute(sql, (p.id_orden_compra, p.id_ingrediente, p.cantidad, p.costo_unitario, p.subtotal, id_detalle))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "ItemOrdenCompra actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar items_orden_compra: {str(e)}")


@router.delete("/{id_detalle}")
async def eliminar_items_orden_compra(id_detalle: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM items_orden_compra WHERE id_detalle = %s"
        cur.execute(sql, (id_detalle,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "ItemOrdenCompra eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar items_orden_compra: {str(e)}")
