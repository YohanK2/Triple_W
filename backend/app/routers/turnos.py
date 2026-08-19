from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.turnos import Turno

router = APIRouter(prefix="/turnos", tags=["turnos"])

@router.get("/", response_model=List[Turno])
def listar_turnos():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_turno, id_empleado, fecha, hora_inicio, hora_fin, observaciones, creado_por, actualizado_por FROM turnos"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Turno] = []
    for r in rows:
        item = Turno(
            id_turno=r["id_turno"],
            id_empleado=r["id_empleado"],
            fecha=str(r["fecha"]) if r["fecha"] is not None else None,
            hora_inicio=str(r["hora_inicio"]) if r["hora_inicio"] is not None else None,
            hora_fin=str(r["hora_fin"]) if r["hora_fin"] is not None else None,
            observaciones=r["observaciones"],
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_turnos(p: Turno):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO turnos (id_empleado, fecha, hora_inicio, hora_fin, observaciones, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_empleado, p.fecha, p.hora_inicio, p.hora_fin, p.observaciones, p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Turno creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear turnos: {str(e)}")


@router.get("/{id_turno}", response_model=Turno)
def obtener_turnos(id_turno: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_turno, id_empleado, fecha, hora_inicio, hora_fin, observaciones, creado_por, actualizado_por FROM turnos WHERE id_turno = %s"
    cur.execute(sql, (id_turno,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    item = Turno(
        id_turno=r["id_turno"],
        id_empleado=r["id_empleado"],
        fecha=str(r["fecha"]) if r["fecha"] is not None else None,
        hora_inicio=str(r["hora_inicio"]) if r["hora_inicio"] is not None else None,
        hora_fin=str(r["hora_fin"]) if r["hora_fin"] is not None else None,
        observaciones=r["observaciones"],
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_turno}")
def actualizar_turnos(id_turno: int, p: Turno):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE turnos
               SET id_empleado = %s,
                   fecha = %s,
                   hora_inicio = %s,
                   hora_fin = %s,
                   observaciones = %s,
                   actualizado_por = %s
             WHERE id_turno = %s
        """
        cur.execute(sql, (p.id_empleado, p.fecha, p.hora_inicio, p.hora_fin, p.observaciones, p.actualizado_por, id_turno))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Turno actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar turnos: {str(e)}")


@router.delete("/{id_turno}")
async def eliminar_turnos(id_turno: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM turnos WHERE id_turno = %s"
        cur.execute(sql, (id_turno,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Turno eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar turnos: {str(e)}")
