from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.categorias_menu import CategoriaMenu

router = APIRouter(prefix="/categorias_menu", tags=["categoria menu"])

@router.get("/", response_model=List[CategoriaMenu])
def listar_categorias_menu():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_categoria, nombre, descripcion, activo, creado_por, actualizado_por FROM categorias_menu"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[CategoriaMenu] = []
    for r in rows:
        item = CategoriaMenu(
            id_categoria=r["id_categoria"],
            nombre=r["nombre"],
            descripcion=r["descripcion"],
            activo=bool(r["activo"]),
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_categorias_menu(p: CategoriaMenu):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO categorias_menu (nombre, descripcion, activo, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, (p.nombre, p.descripcion, int(p.activo), p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "CategoriaMenu creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear categorias_menu: {str(e)}")


@router.get("/{id_categoria}", response_model=CategoriaMenu)
def obtener_categorias_menu(id_categoria: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_categoria, nombre, descripcion, activo, creado_por, actualizado_por FROM categorias_menu WHERE id_categoria = %s"
    cur.execute(sql, (id_categoria,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="CategoriaMenu no encontrado")

    item = CategoriaMenu(
        id_categoria=r["id_categoria"],
        nombre=r["nombre"],
        descripcion=r["descripcion"],
        activo=bool(r["activo"]),
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_categoria}")
def actualizar_categorias_menu(id_categoria: int, p: CategoriaMenu):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE categorias_menu
               SET nombre = %s,
                   descripcion = %s,
                   activo = %s,
                   actualizado_por = %s
             WHERE id_categoria = %s
        """
        cur.execute(sql, (p.nombre, p.descripcion, int(p.activo), p.actualizado_por, id_categoria))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "CategoriaMenu actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar categorias_menu: {str(e)}")


@router.delete("/{id_categoria}")
async def eliminar_categorias_menu(id_categoria: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM categorias_menu WHERE id_categoria = %s"
        cur.execute(sql, (id_categoria,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "CategoriaMenu eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar categorias_menu: {str(e)}")
