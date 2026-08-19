from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.promociones import Promocion

router = APIRouter(prefix="/promociones", tags=["promociones"])

@router.get("/", response_model=List[Promocion])
def listar_promociones():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_promocion, nombre, descripcion, porcentaje_descuento, fecha_inicio, fecha_fin, activa, creado_por, actualizado_por FROM promociones"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Promocion] = []
    for r in rows:
        item = Promocion(
            id_promocion=r["id_promocion"],
            nombre=r["nombre"],
            descripcion=r["descripcion"],
            porcentaje_descuento=float(r["porcentaje_descuento"]) if r["porcentaje_descuento"] is not None else None,
            fecha_inicio=str(r["fecha_inicio"]) if r["fecha_inicio"] is not None else None,
            fecha_fin=str(r["fecha_fin"]) if r["fecha_fin"] is not None else None,
            activa=bool(r["activa"]),
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_promociones(p: Promocion):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO promociones (nombre, descripcion, porcentaje_descuento, fecha_inicio, fecha_fin, activa, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.nombre, p.descripcion, p.porcentaje_descuento, p.fecha_inicio, p.fecha_fin, int(p.activa), p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Promocion creada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear promociones: {str(e)}")


@router.get("/{id_promocion}", response_model=Promocion)
def obtener_promociones(id_promocion: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_promocion, nombre, descripcion, porcentaje_descuento, fecha_inicio, fecha_fin, activa, creado_por, actualizado_por FROM promociones WHERE id_promocion = %s"
    cur.execute(sql, (id_promocion,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Promocion no encontrada")

    item = Promocion(
        id_promocion=r["id_promocion"],
        nombre=r["nombre"],
        descripcion=r["descripcion"],
        porcentaje_descuento=float(r["porcentaje_descuento"]) if r["porcentaje_descuento"] is not None else None,
        fecha_inicio=str(r["fecha_inicio"]) if r["fecha_inicio"] is not None else None,
        fecha_fin=str(r["fecha_fin"]) if r["fecha_fin"] is not None else None,
        activa=bool(r["activa"]),
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_promocion}")
def actualizar_promociones(id_promocion: int, p: Promocion):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE promociones
               SET nombre = %s,
                   descripcion = %s,
                   porcentaje_descuento = %s,
                   fecha_inicio = %s,
                   fecha_fin = %s,
                   activa = %s,
                   actualizado_por = %s
             WHERE id_promocion = %s
        """
        cur.execute(sql, (p.nombre, p.descripcion, p.porcentaje_descuento, p.fecha_inicio, p.fecha_fin, int(p.activa), p.actualizado_por, id_promocion))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Promocion actualizada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar promociones: {str(e)}")


@router.delete("/{id_promocion}")
async def eliminar_promociones(id_promocion: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM promociones WHERE id_promocion = %s"
        cur.execute(sql, (id_promocion,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Promocion eliminada con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar promociones: {str(e)}")
