from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.ingredientes import Ingrediente

router = APIRouter(prefix="/ingredientes", tags=["ingredientes"])


@router.get("/", response_model=List[Ingrediente])
def listar_ingredientes():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_ingrediente, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, activo, creado_por, actualizado_por FROM ingredientes"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Ingrediente] = []
    for r in rows:
        item = Ingrediente(
            id_ingrediente=r["id_ingrediente"],
            nombre=r["nombre"],
            descripcion=r["descripcion"],
            unidad_medida=r["unidad_medida"],
            stock_actual=float(r["stock_actual"]) if r["stock_actual"] is not None else None,
            stock_minimo=float(r["stock_minimo"]) if r["stock_minimo"] is not None else None,
            activo=bool(r["activo"]),
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_ingredientes(p: Ingrediente):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO ingredientes (nombre, descripcion, unidad_medida, stock_actual, stock_minimo, activo, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.nombre, p.descripcion, p.unidad_medida, p.stock_actual, p.stock_minimo, int(p.activo), p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Ingrediente creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear ingredientes: {str(e)}")


@router.get("/{id_ingrediente}", response_model=Ingrediente)
def obtener_ingredientes(id_ingrediente: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_ingrediente, nombre, descripcion, unidad_medida, stock_actual, stock_minimo, activo, creado_por, actualizado_por FROM ingredientes WHERE id_ingrediente = %s"
    cur.execute(sql, (id_ingrediente,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")

    item = Ingrediente(
        id_ingrediente=r["id_ingrediente"],
        nombre=r["nombre"],
        descripcion=r["descripcion"],
        unidad_medida=r["unidad_medida"],
        stock_actual=float(r["stock_actual"]) if r["stock_actual"] is not None else None,
        stock_minimo=float(r["stock_minimo"]) if r["stock_minimo"] is not None else None,
        activo=bool(r["activo"]),
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_ingrediente}")
def actualizar_ingredientes(id_ingrediente: int, p: Ingrediente):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE ingredientes
               SET nombre = %s,
                   descripcion = %s,
                   unidad_medida = %s,
                   stock_actual = %s,
                   stock_minimo = %s,
                   activo = %s,
                   actualizado_por = %s
             WHERE id_ingrediente = %s
        """
        cur.execute(sql, (p.nombre, p.descripcion, p.unidad_medida, p.stock_actual, p.stock_minimo, int(p.activo), p.actualizado_por, id_ingrediente))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Ingrediente actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar ingredientes: {str(e)}")


@router.delete("/{id_ingrediente}")
async def eliminar_ingredientes(id_ingrediente: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM ingredientes WHERE id_ingrediente = %s"
        cur.execute(sql, (id_ingrediente,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Ingrediente eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar ingredientes: {str(e)}")
