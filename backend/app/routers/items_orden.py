from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.items_orden import ItemOrden

router = APIRouter(prefix="/items_orden", tags=["orden"])

@router.get("/", response_model=List[ItemOrden])
def listar_items_orden():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_item_orden, id_orden, id_item_menu, cantidad, precio_unitario, subtotal, instrucciones_especiales FROM items_orden"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[ItemOrden] = []
    for r in rows:
        item = ItemOrden(
            id_item_orden=r["id_item_orden"],
            id_orden=r["id_orden"],
            id_item_menu=r["id_item_menu"],
            cantidad=r["cantidad"],
            precio_unitario=float(r["precio_unitario"]) if r["precio_unitario"] is not None else None,
            subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
            instrucciones_especiales=r["instrucciones_especiales"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_items_orden(p: ItemOrden):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO items_orden (id_orden, id_item_menu, cantidad, precio_unitario, subtotal, instrucciones_especiales) VALUES (%s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_orden, p.id_item_menu, p.cantidad, p.precio_unitario, p.subtotal, p.instrucciones_especiales))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "ItemOrden creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear items_orden: {str(e)}")


@router.get("/{id_item_orden}", response_model=ItemOrden)
def obtener_items_orden(id_item_orden: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_item_orden, id_orden, id_item_menu, cantidad, precio_unitario, subtotal, instrucciones_especiales FROM items_orden WHERE id_item_orden = %s"
    cur.execute(sql, (id_item_orden,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="ItemOrden no encontrado")

    item = ItemOrden(
        id_item_orden=r["id_item_orden"],
        id_orden=r["id_orden"],
        id_item_menu=r["id_item_menu"],
        cantidad=r["cantidad"],
        precio_unitario=float(r["precio_unitario"]) if r["precio_unitario"] is not None else None,
        subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
        instrucciones_especiales=r["instrucciones_especiales"],
    )
    return item


@router.put("/{id_item_orden}")
def actualizar_items_orden(id_item_orden: int, p: ItemOrden):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE items_orden
               SET id_orden = %s,
                   id_item_menu = %s,
                   cantidad = %s,
                   precio_unitario = %s,
                   subtotal = %s,
                   instrucciones_especiales = %s
             WHERE id_item_orden = %s
        """
        cur.execute(sql, (p.id_orden, p.id_item_menu, p.cantidad, p.precio_unitario, p.subtotal, p.instrucciones_especiales, id_item_orden))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "ItemOrden actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar items_orden: {str(e)}")


@router.delete("/{id_item_orden}")
async def eliminar_items_orden(id_item_orden: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM items_orden WHERE id_item_orden = %s"
        cur.execute(sql, (id_item_orden,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "ItemOrden eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar items_orden: {str(e)}")
