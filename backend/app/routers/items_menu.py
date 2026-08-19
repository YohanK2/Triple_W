from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.items_menu import ItemMenu

router = APIRouter(prefix="/items_menu", tags=["menu"])


@router.get("/", response_model=List[ItemMenu])
def listar_items_menu():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_item_menu, id_categoria, nombre, descripcion, precio, imagen, disponible, creado_por, actualizado_por, creado_en FROM items_menu"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[ItemMenu] = []
    for r in rows:
        item = ItemMenu(
            id_item_menu=r["id_item_menu"],
            id_categoria=r["id_categoria"],
            nombre=r["nombre"],
            descripcion=r["descripcion"],
            precio=float(r["precio"]) if r["precio"] is not None else None,
            imagen=r["imagen"],
            disponible=bool(r["disponible"]),
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_items_menu(p: ItemMenu):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO items_menu (id_categoria, nombre, descripcion, precio, imagen, disponible, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_categoria, p.nombre, p.descripcion, p.precio, p.imagen, int(p.disponible), p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "ItemMenu creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear items_menu: {str(e)}")


@router.get("/{id_item_menu}", response_model=ItemMenu)
def obtener_items_menu(id_item_menu: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_item_menu, id_categoria, nombre, descripcion, precio, imagen, disponible, creado_por, actualizado_por, creado_en FROM items_menu WHERE id_item_menu = %s"
    cur.execute(sql, (id_item_menu,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="ItemMenu no encontrado")

    item = ItemMenu(
        id_item_menu=r["id_item_menu"],
        id_categoria=r["id_categoria"],
        nombre=r["nombre"],
        descripcion=r["descripcion"],
        precio=float(r["precio"]) if r["precio"] is not None else None,
        imagen=r["imagen"],
        disponible=bool(r["disponible"]),
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
    )
    return item


@router.put("/{id_item_menu}")
def actualizar_items_menu(id_item_menu: int, p: ItemMenu):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE items_menu
               SET id_categoria = %s,
                   nombre = %s,
                   descripcion = %s,
                   precio = %s,
                   imagen = %s,
                   disponible = %s,
                   actualizado_por = %s
             WHERE id_item_menu = %s
        """
        cur.execute(sql, (p.id_categoria, p.nombre, p.descripcion, p.precio, p.imagen, int(p.disponible), p.actualizado_por, id_item_menu))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "ItemMenu actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar items_menu: {str(e)}")


@router.delete("/{id_item_menu}")
async def eliminar_items_menu(id_item_menu: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM items_menu WHERE id_item_menu = %s"
        cur.execute(sql, (id_item_menu,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "ItemMenu eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar items_menu: {str(e)}")
