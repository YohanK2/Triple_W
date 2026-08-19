from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.estados_orden import EstadoOrden

router = APIRouter(prefix="/estados_orden", tags=["estados orden"])


@router.get("/", response_model=List[EstadoOrden])
def listar_estados_orden():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_estado, nombre_estado, descripcion FROM estados_orden"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[EstadoOrden] = []
    for r in rows:
        item = EstadoOrden(
            id_estado=r["id_estado"],
            nombre_estado=r["nombre_estado"],
            descripcion=r["descripcion"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_estados_orden(p: EstadoOrden):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO estados_orden (nombre_estado, descripcion) VALUES (%s, %s)"
        cur.execute(sql, (p.nombre_estado, p.descripcion))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "EstadoOrden creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear estados_orden: {str(e)}")


@router.get("/{id_estado}", response_model=EstadoOrden)
def obtener_estados_orden(id_estado: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_estado, nombre_estado, descripcion FROM estados_orden WHERE id_estado = %s"
    cur.execute(sql, (id_estado,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="EstadoOrden no encontrado")

    item = EstadoOrden(
        id_estado=r["id_estado"],
        nombre_estado=r["nombre_estado"],
        descripcion=r["descripcion"],
    )
    return item


@router.put("/{id_estado}")
def actualizar_estados_orden(id_estado: int, p: EstadoOrden):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE estados_orden
               SET nombre_estado = %s,
                   descripcion = %s
             WHERE id_estado = %s
        """
        cur.execute(sql, (p.nombre_estado, p.descripcion, id_estado))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "EstadoOrden actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar estados_orden: {str(e)}")


@router.delete("/{id_estado}")
async def eliminar_estados_orden(id_estado: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM estados_orden WHERE id_estado = %s"
        cur.execute(sql, (id_estado,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "EstadoOrden eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar estados_orden: {str(e)}")
