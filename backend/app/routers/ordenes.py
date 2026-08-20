from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.ordenes import Orden
from app.schemas.items_orden import ItemOrdenDetalle

router = APIRouter(prefix="/ordenes", tags=["ordenes"])

@router.get("/", response_model=List[Orden])
def listar_ordenes():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT o.id_orden, o.id_cliente, o.id_mesa, o.id_mesero, o.subtotal, o.impuesto, o.total, o.estado, o.notas, o.creado_en, o.actualizado_en, m.nombres AS nombre_mesero FROM ordenes o LEFT JOIN usuarios m ON o.id_mesero = m.id_usuario"
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
            nombre_mesero=r.get("nombre_mesero"),
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
        id_orden_creado = cur.lastrowid
        cur.close()
        conn.close()
        return {"mensaje": "Orden creado con éxito", "id_orden": id_orden_creado}
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


@router.get("/{id_orden}/items", response_model=List[ItemOrdenDetalle])
def obtener_items_orden(id_orden: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = """
        SELECT io.id_item_orden, io.id_orden, io.id_item_menu, io.cantidad, io.precio_unitario, io.subtotal, io.instrucciones_especiales, im.nombre
        FROM items_orden io
        INNER JOIN items_menu im ON io.id_item_menu = im.id_item_menu
        WHERE io.id_orden = %s
    """
    cur.execute(sql, (id_orden,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    resultado = []
    for r in rows:
        resultado.append({
            "id_item_orden": r["id_item_orden"],
            "id_orden": r["id_orden"],
            "id_item_menu": r["id_item_menu"],
            "cantidad": r["cantidad"],
            "precio_unitario": float(r["precio_unitario"]) if r["precio_unitario"] is not None else None,
            "subtotal": float(r["subtotal"]) if r["subtotal"] is not None else None,
            "instrucciones_especiales": r["instrucciones_especiales"],
            "nombre": r["nombre"],
        })
    return resultado


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
