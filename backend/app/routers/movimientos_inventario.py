from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.movimientos_inventario import MovimientoInventario

router = APIRouter(prefix="/movimientos_inventario", tags=["inventario"])

@router.get("/", response_model=List[MovimientoInventario])
def listar_movimientos_inventario():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_movimiento, id_ingrediente, tipo_movimiento, cantidad, motivo, id_usuario, creado_en FROM movimientos_inventario"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[MovimientoInventario] = []
    for r in rows:
        item = MovimientoInventario(
            id_movimiento=r["id_movimiento"],
            id_ingrediente=r["id_ingrediente"],
            tipo_movimiento=r["tipo_movimiento"],
            cantidad=float(r["cantidad"]) if r["cantidad"] is not None else None,
            motivo=r["motivo"],
            id_usuario=r["id_usuario"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_movimientos_inventario(p: MovimientoInventario):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO movimientos_inventario (id_ingrediente, tipo_movimiento, cantidad, motivo, id_usuario) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_ingrediente, p.tipo_movimiento, p.cantidad, p.motivo, p.id_usuario))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "MovimientoInventario creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear movimientos_inventario: {str(e)}")


@router.get("/{id_movimiento}", response_model=MovimientoInventario)
def obtener_movimientos_inventario(id_movimiento: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_movimiento, id_ingrediente, tipo_movimiento, cantidad, motivo, id_usuario, creado_en FROM movimientos_inventario WHERE id_movimiento = %s"
    cur.execute(sql, (id_movimiento,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="MovimientoInventario no encontrado")

    item = MovimientoInventario(
        id_movimiento=r["id_movimiento"],
        id_ingrediente=r["id_ingrediente"],
        tipo_movimiento=r["tipo_movimiento"],
        cantidad=float(r["cantidad"]) if r["cantidad"] is not None else None,
        motivo=r["motivo"],
        id_usuario=r["id_usuario"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
    )
    return item


@router.put("/{id_movimiento}")
def actualizar_movimientos_inventario(id_movimiento: int, p: MovimientoInventario):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE movimientos_inventario
               SET id_ingrediente = %s,
                   tipo_movimiento = %s,
                   cantidad = %s,
                   motivo = %s,
                   id_usuario = %s
             WHERE id_movimiento = %s
        """
        cur.execute(sql, (p.id_ingrediente, p.tipo_movimiento, p.cantidad, p.motivo, p.id_usuario, id_movimiento))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "MovimientoInventario actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar movimientos_inventario: {str(e)}")


@router.delete("/{id_movimiento}")
async def eliminar_movimientos_inventario(id_movimiento: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM movimientos_inventario WHERE id_movimiento = %s"
        cur.execute(sql, (id_movimiento,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "MovimientoInventario eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar movimientos_inventario: {str(e)}")
