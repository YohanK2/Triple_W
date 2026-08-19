from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.facturas import Factura

router = APIRouter(prefix="/facturas", tags=["facturas"])


@router.get("/", response_model=List[Factura])
def listar_facturas():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_factura, id_orden, numero_factura, subtotal, impuesto, total, metodo_pago, numero_referencia, creado_por, fecha_emision FROM facturas"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Factura] = []
    for r in rows:
        item = Factura(
            id_factura=r["id_factura"],
            id_orden=r["id_orden"],
            numero_factura=r["numero_factura"],
            subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
            impuesto=float(r["impuesto"]) if r["impuesto"] is not None else None,
            total=float(r["total"]) if r["total"] is not None else None,
            metodo_pago=r["metodo_pago"],
            numero_referencia=r["numero_referencia"],
            creado_por=r["creado_por"],
            fecha_emision=str(r["fecha_emision"]) if r["fecha_emision"] is not None else None,
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_facturas(p: Factura):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO facturas (id_orden, numero_factura, subtotal, impuesto, total, metodo_pago, numero_referencia, creado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.id_orden, p.numero_factura, p.subtotal, p.impuesto, p.total, p.metodo_pago, p.numero_referencia, p.creado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Factura creada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear facturas: {str(e)}")


@router.get("/{id_factura}", response_model=Factura)
def obtener_facturas(id_factura: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_factura, id_orden, numero_factura, subtotal, impuesto, total, metodo_pago, numero_referencia, creado_por, fecha_emision FROM facturas WHERE id_factura = %s"
    cur.execute(sql, (id_factura,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    item = Factura(
        id_factura=r["id_factura"],
        id_orden=r["id_orden"],
        numero_factura=r["numero_factura"],
        subtotal=float(r["subtotal"]) if r["subtotal"] is not None else None,
        impuesto=float(r["impuesto"]) if r["impuesto"] is not None else None,
        total=float(r["total"]) if r["total"] is not None else None,
        metodo_pago=r["metodo_pago"],
        numero_referencia=r["numero_referencia"],
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
        fecha_emision=str(r["fecha_emision"]) if r["fecha_emision"] is not None else None,
    )
    return item


@router.put("/{id_factura}")
def actualizar_facturas(id_factura: int, p: Factura):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE facturas
               SET id_orden = %s,
                   numero_factura = %s,
                   subtotal = %s,
                   impuesto = %s,
                   total = %s,
                   metodo_pago = %s,
                   numero_referencia = %s
             WHERE id_factura = %s
        """
        cur.execute(sql, (p.id_orden, p.numero_factura, p.subtotal, p.impuesto, p.total, p.metodo_pago, p.numero_referencia, id_factura))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Factura actualizada con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar facturas: {str(e)}")


@router.delete("/{id_factura}")
async def eliminar_facturas(id_factura: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM facturas WHERE id_factura = %s"
        cur.execute(sql, (id_factura,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Factura eliminada con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar facturas: {str(e)}")
