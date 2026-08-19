from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.reservas import Reservas

router = APIRouter(prefix="/reservas", tags=["reservas"])

@router.get("/", response_model=List[Reservas])
def listar_reservas():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = (
        "SELECT id_reserva, id_cliente, id_mesa, fecha_reserva, "
        "tamano_grupo, estado, notas, creado_por, actualizado_por FROM reservas"
    )
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    reservas: List[Reservas] = []
    for r in rows:
        reserva = Reservas(
            id_reserva=r["id_reserva"],
            id_cliente=r["id_cliente"],
            id_mesa=r["id_mesa"],
            fecha_reserva=r["fecha_reserva"],
            tamano_grupo=r["tamano_grupo"],
            estado=r["estado"],
            notas=r["notas"],
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        reservas.append(reserva)

    return reservas

@router.post("/")
def crear_reserva(r: Reservas):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO reservas (id_cliente, id_mesa, fecha_reserva, tamano_grupo, estado, notas, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (r.id_cliente, r.id_mesa, r.fecha_reserva, r.tamano_grupo, r.estado, r.notas, r.creado_por, r.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        mensaje = {"mensaje": "Reserva creada con éxito"}
        return mensaje
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear reserva: {str(e)}")

 # Obtener uno por ID
@router.get("/{reserva_id}", response_model=Reservas)
def obtener_reserva(reserva_id: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_reserva, id_cliente, id_mesa, fecha_reserva, tamano_grupo, estado, notas, creado_por, actualizado_por FROM reservas WHERE id_reserva = %s"
    cur.execute(sql, (reserva_id,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    reserva = Reservas(
        id_reserva=r["id_reserva"],
        id_cliente=r["id_cliente"],
        id_mesa=r["id_mesa"],
        fecha_reserva=r["fecha_reserva"],
        tamano_grupo=r["tamano_grupo"],
        estado=r["estado"],
        notas=r["notas"],
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return reserva

# Actualizar
@router.put("/{reserva_id}")
def actualizar_reserva(reserva_id: int, r: Reservas):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE reservas
               SET id_cliente = %s,
                   id_mesa = %s,
                   fecha_reserva = %s,
                   tamano_grupo = %s,
                   estado = %s,
                   notas = %s,
                   actualizado_por = %s
             WHERE id_reserva = %s
        """
        cur.execute(sql, (r.id_cliente, r.id_mesa, r.fecha_reserva, r.tamano_grupo, r.estado, r.notas, r.actualizado_por, reserva_id))

        conn.commit()

        cur.close()
        conn.close()

        mensaje = {"mensaje": "Reserva actualizada con éxito"}
        return mensaje
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar reserva: {str(e)}")

    # Eliminar un cliente por ID
@router.delete("/{reserva_id}")
async def eliminar_reserva(reserva_id: int):
        try:

            conn = get_conn()
            cur = conn.cursor()

            sql = "DELETE FROM reservas WHERE id_reserva = %s"
            cur.execute(sql, (reserva_id,))
            conn.commit()

            cur.close()
            conn.close()
            return {"mensaje": "Reserva eliminada con éxito"}

        except mysql.connector.Error as e:
            conn.rollback()
            conn.close()
            raise HTTPException(status_code=400, detail=f"Error al eliminar reserva: {str(e)}")
