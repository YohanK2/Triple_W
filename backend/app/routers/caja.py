from typing import List, Optional

import mysql.connector
from fastapi import APIRouter, HTTPException

from app.core.conexion import get_conn
from app.schemas.caja import AperturaCaja, CierreCaja, MovimientoCaja, NuevoMovimientoCaja, SesionCaja

router = APIRouter(prefix='/caja', tags=['caja'])


def _ensure_table(conn):
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sesiones_caja (
            id_sesion INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            id_usuario INT UNSIGNED NOT NULL,
            fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fondo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            fecha_cierre DATETIME NULL,
            efectivo_contado DECIMAL(10,2) NULL,
            efectivo_esperado DECIMAL(10,2) NULL,
            diferencia DECIMAL(10,2) NULL,
            estado ENUM('abierta','cerrada') NOT NULL DEFAULT 'abierta',
            observaciones VARCHAR(300) NULL,
            INDEX idx_sesiones_caja_usuario (id_usuario),
            INDEX idx_sesiones_caja_estado (estado)
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS movimientos_caja (
            id_movimiento INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
            id_sesion INT UNSIGNED NOT NULL,
            tipo ENUM('ingreso','retiro') NOT NULL,
            concepto VARCHAR(200) NOT NULL,
            monto DECIMAL(10,2) NOT NULL,
            creado_por INT UNSIGNED NOT NULL,
            creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_movimientos_caja_sesion (id_sesion)
        )
        """
    )
    conn.commit()
    cursor.close()


def _to_model(row) -> Optional[SesionCaja]:
    return SesionCaja(
        id_sesion=row['id_sesion'],
        id_usuario=row['id_usuario'],
        fecha_apertura=row['fecha_apertura'],
        fondo_inicial=float(row['fondo_inicial']),
        fecha_cierre=row['fecha_cierre'],
        efectivo_contado=float(row['efectivo_contado']) if row['efectivo_contado'] is not None else None,
        efectivo_esperado=float(row['efectivo_esperado']) if row['efectivo_esperado'] is not None else None,
        diferencia=float(row['diferencia']) if row['diferencia'] is not None else None,
        estado=row['estado'],
        observaciones=row['observaciones'],
    )


def _find_open(cursor, id_usuario):
    cursor.execute(
        "SELECT id_sesion, id_usuario, fecha_apertura, fondo_inicial, fecha_cierre, "
        "efectivo_contado, efectivo_esperado, diferencia, estado, observaciones "
        "FROM sesiones_caja WHERE id_usuario = %s AND estado = 'abierta' "
        "ORDER BY id_sesion DESC LIMIT 1",
        (id_usuario,),
    )
    return cursor.fetchone()


@router.get('/sesion/{id_usuario}', response_model=Optional[SesionCaja])
def obtener_sesion_abierta(id_usuario: int):
    conn = get_conn()
    try:
        _ensure_table(conn)
        cursor = conn.cursor(dictionary=True)
        row = _find_open(cursor, id_usuario)
        cursor.close()
        return _to_model(row) if row else None
    finally:
        conn.close()


@router.get('/sesiones', response_model=List[SesionCaja])
def listar_sesiones(id_usuario: Optional[int] = None):
    conn = get_conn()
    try:
        _ensure_table(conn)
        cursor = conn.cursor(dictionary=True)
        sql = (
            "SELECT id_sesion, id_usuario, fecha_apertura, fondo_inicial, fecha_cierre, "
            "efectivo_contado, efectivo_esperado, diferencia, estado, observaciones "
            "FROM sesiones_caja"
        )
        params = ()
        if id_usuario is not None:
            sql += ' WHERE id_usuario = %s'
            params = (id_usuario,)
        sql += ' ORDER BY id_sesion DESC'
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        cursor.close()
        return [_to_model(row) for row in rows]
    finally:
        conn.close()


@router.post('/sesiones', response_model=SesionCaja)
def abrir_sesion(apertura: AperturaCaja):
    if apertura.fondo_inicial < 0:
        raise HTTPException(status_code=400, detail='El fondo inicial no puede ser negativo')

    conn = get_conn()
    try:
        _ensure_table(conn)
        cursor = conn.cursor(dictionary=True)
        if _find_open(cursor, apertura.id_usuario):
            raise HTTPException(status_code=409, detail='El cajero ya tiene una caja abierta')
        cursor.execute(
            "INSERT INTO sesiones_caja (id_usuario, fondo_inicial) VALUES (%s, %s)",
            (apertura.id_usuario, apertura.fondo_inicial),
        )
        conn.commit()
        id_sesion = cursor.lastrowid
        cursor.execute(
            "SELECT id_sesion, id_usuario, fecha_apertura, fondo_inicial, fecha_cierre, "
            "efectivo_contado, efectivo_esperado, diferencia, estado, observaciones "
            "FROM sesiones_caja WHERE id_sesion = %s",
            (id_sesion,),
        )
        row = cursor.fetchone()
        cursor.close()
        return _to_model(row)
    except HTTPException:
        conn.rollback()
        raise
    except mysql.connector.Error as error:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f'No se pudo abrir la caja: {error}')
    finally:
        conn.close()


@router.put('/sesiones/{id_sesion}/cerrar', response_model=SesionCaja)
def cerrar_sesion(id_sesion: int, cierre: CierreCaja):
    conn = get_conn()
    try:
        _ensure_table(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "UPDATE sesiones_caja SET fecha_cierre = CURRENT_TIMESTAMP, efectivo_contado = %s, "
            "efectivo_esperado = %s, diferencia = %s, estado = 'cerrada', observaciones = %s "
            "WHERE id_sesion = %s AND estado = 'abierta'",
            (cierre.efectivo_contado, cierre.efectivo_esperado, cierre.diferencia, cierre.observaciones, id_sesion),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail='Sesión de caja abierta no encontrada')
        conn.commit()
        cursor.execute(
            "SELECT id_sesion, id_usuario, fecha_apertura, fondo_inicial, fecha_cierre, "
            "efectivo_contado, efectivo_esperado, diferencia, estado, observaciones "
            "FROM sesiones_caja WHERE id_sesion = %s",
            (id_sesion,),
        )
        row = cursor.fetchone()
        cursor.close()
        return _to_model(row)
    except HTTPException:
        conn.rollback()
        raise
    except mysql.connector.Error as error:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f'No se pudo cerrar la caja: {error}')
    finally:
        conn.close()


@router.get('/sesiones/{id_sesion}/movimientos', response_model=List[MovimientoCaja])
def listar_movimientos(id_sesion: int):
    conn = get_conn()
    try:
        _ensure_table(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id_movimiento, id_sesion, tipo, concepto, monto, creado_por, creado_en "
            "FROM movimientos_caja WHERE id_sesion = %s ORDER BY id_movimiento DESC",
            (id_sesion,),
        )
        rows = cursor.fetchall()
        cursor.close()
        return [MovimientoCaja(**{**row, 'monto': float(row['monto'])}) for row in rows]
    finally:
        conn.close()


@router.post('/sesiones/{id_sesion}/movimientos', response_model=MovimientoCaja)
def crear_movimiento(id_sesion: int, movimiento: NuevoMovimientoCaja):
    if movimiento.tipo not in {'ingreso', 'retiro'}:
        raise HTTPException(status_code=400, detail='Tipo de movimiento inválido')
    if movimiento.monto <= 0:
        raise HTTPException(status_code=400, detail='El monto debe ser mayor a cero')
    if not movimiento.concepto.strip():
        raise HTTPException(status_code=400, detail='El concepto es obligatorio')

    conn = get_conn()
    try:
        _ensure_table(conn)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT estado FROM sesiones_caja WHERE id_sesion = %s", (id_sesion,))
        session = cursor.fetchone()
        if not session or session['estado'] != 'abierta':
            raise HTTPException(status_code=409, detail='La sesión de caja no está abierta')
        cursor.execute(
            "INSERT INTO movimientos_caja (id_sesion, tipo, concepto, monto, creado_por) "
            "VALUES (%s, %s, %s, %s, %s)",
            (id_sesion, movimiento.tipo, movimiento.concepto.strip(), movimiento.monto, movimiento.creado_por),
        )
        conn.commit()
        id_movimiento = cursor.lastrowid
        cursor.execute(
            "SELECT id_movimiento, id_sesion, tipo, concepto, monto, creado_por, creado_en "
            "FROM movimientos_caja WHERE id_movimiento = %s",
            (id_movimiento,),
        )
        row = cursor.fetchone()
        cursor.close()
        return MovimientoCaja(**{**row, 'monto': float(row['monto'])})
    except HTTPException:
        conn.rollback()
        raise
    except mysql.connector.Error as error:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f'No se pudo registrar el movimiento: {error}')
    finally:
        conn.close()
