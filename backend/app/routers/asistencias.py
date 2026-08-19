from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.asistencias import Asistencia

router = APIRouter(prefix="/asistencias", tags=["asistencias"])

# --------- Rutas ---------
@router.get("/", response_model=List[Asistencia])
def listar_asistencias():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_asistencia, id_empleado, id_turno, hora_entrada, hora_salida, horas_trabajadas FROM asistencias"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Asistencia] = []
    for r in rows:
        item = Asistencia(
            id_asistencia=r["id_asistencia"],
            id_empleado=r["id_empleado"],
            id_turno=r["id_turno"],
            hora_entrada=str(r["hora_entrada"]),
            hora_salida=str(r["hora_salida"]) if r["hora_salida"] is not None else None,
            horas_trabajadas=float(r["horas_trabajadas"]) if r["horas_trabajadas"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_asistencias(p: Asistencia):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO asistencias (id_empleado, id_turno, hora_entrada, hora_salida, horas_trabajadas) VALUES (%s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_empleado, p.id_turno, p.hora_entrada, p.hora_salida, p.horas_trabajadas))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Asistencia creada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear asistencias: {str(e)}")


@router.get("/{id_asistencia}", response_model=Asistencia)
def obtener_asistencias(id_asistencia: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_asistencia, id_empleado, id_turno, hora_entrada, hora_salida, horas_trabajadas FROM asistencias WHERE id_asistencia = %s"
    cur.execute(sql, (id_asistencia,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Asistencia no encontrada")

    item = Asistencia(
        id_asistencia=r["id_asistencia"],
        id_empleado=r["id_empleado"],
        id_turno=r["id_turno"],
        hora_entrada=str(r["hora_entrada"]),
        hora_salida=str(r["hora_salida"]) if r["hora_salida"] is not None else None,
        horas_trabajadas=float(r["horas_trabajadas"]) if r["horas_trabajadas"] is not None else None,
    )
    return item


@router.put("/{id_asistencia}")
def actualizar_asistencias(id_asistencia: int, p: Asistencia):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE asistencias
               SET id_empleado = %s,
                   id_turno = %s,
                   hora_entrada = %s,
                   hora_salida = %s,
                   horas_trabajadas = %s
             WHERE id_asistencia = %s
        """
        cur.execute(sql, (p.id_empleado, p.id_turno, p.hora_entrada, p.hora_salida, p.horas_trabajadas, id_asistencia))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Asistencia actualizada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar asistencias: {str(e)}")


@router.delete("/{id_asistencia}")
async def eliminar_asistencias(id_asistencia: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM asistencias WHERE id_asistencia = %s"
        cur.execute(sql, (id_asistencia,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Asistencia eliminada con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar asistencias: {str(e)}")
