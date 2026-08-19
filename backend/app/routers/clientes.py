from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.clientes import Cliente

router = APIRouter(prefix="/clientes", tags=["clientes"])

@router.get("/", response_model=List[Cliente])
def listar_clientes():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_cliente, nombre, telefono, correo, direccion, puntos_fidelidad, creado_por, actualizado_por, creado_en FROM clientes"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Cliente] = []
    for r in rows:
        item = Cliente(
            id_cliente=r["id_cliente"],
            nombre=r["nombre"],
            telefono=r["telefono"],
            correo=r["correo"],
            direccion=r["direccion"],
            puntos_fidelidad=r["puntos_fidelidad"],
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
            creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_clientes(p: Cliente):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO clientes (nombre, telefono, correo, direccion, puntos_fidelidad, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.nombre, p.telefono, p.correo, p.direccion, p.puntos_fidelidad, p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Cliente creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear clientes: {str(e)}")


@router.get("/{id_cliente}", response_model=Cliente)
def obtener_clientes(id_cliente: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_cliente, nombre, telefono, correo, direccion, puntos_fidelidad, creado_por, actualizado_por, creado_en FROM clientes WHERE id_cliente = %s"
    cur.execute(sql, (id_cliente,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    item = Cliente(
        id_cliente=r["id_cliente"],
        nombre=r["nombre"],
        telefono=r["telefono"],
        correo=r["correo"],
        direccion=r["direccion"],
        puntos_fidelidad=r["puntos_fidelidad"],
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
        creado_en=str(r["creado_en"]) if r["creado_en"] is not None else None,
    )
    return item


@router.put("/{id_cliente}")
def actualizar_clientes(id_cliente: int, p: Cliente):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE clientes
               SET nombre = %s,
                   telefono = %s,
                   correo = %s,
                   direccion = %s,
                   puntos_fidelidad = %s,
                   actualizado_por = %s
             WHERE id_cliente = %s
        """
        cur.execute(sql, (p.nombre, p.telefono, p.correo, p.direccion, p.puntos_fidelidad, p.actualizado_por, id_cliente))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Cliente actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar clientes: {str(e)}")


@router.delete("/{id_cliente}")
async def eliminar_clientes(id_cliente: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM clientes WHERE id_cliente = %s"
        cur.execute(sql, (id_cliente,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Cliente eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar clientes: {str(e)}")
