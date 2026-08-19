from fastapi import APIRouter, HTTPException
from typing import List
import mysql.connector

from app.core.conexion import get_conn
from app.schemas.proveedores import Proveedor

router = APIRouter(prefix="/proveedores", tags=["proveedores"])

@router.get("/", response_model=List[Proveedor])
def listar_proveedores():
    conn = get_conn()
    cursor = conn.cursor(dictionary=True)

    sql = "SELECT id_proveedor, empresa, contacto, telefono, correo, direccion, activo, creado_por, actualizado_por FROM proveedores"
    cursor.execute(sql)
    rows = cursor.fetchall()

    cursor.close()
    conn.close()

    resultado: List[Proveedor] = []
    for r in rows:
        item = Proveedor(
            id_proveedor=r["id_proveedor"],
            empresa=r["empresa"],
            contacto=r["contacto"],
            telefono=r["telefono"],
            correo=r["correo"],
            direccion=r["direccion"],
            activo=bool(r["activo"]),
            creado_por=r["creado_por"],
            actualizado_por=r["actualizado_por"],
        )
        resultado.append(item)

    return resultado


@router.post("/")
def crear_proveedores(p: Proveedor):
    try:
        conn = get_conn()
        cur = conn.cursor()
        sql = "INSERT INTO proveedores (empresa, contacto, telefono, correo, direccion, activo, creado_por, actualizado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cur.execute(sql, (p.empresa, p.contacto, p.telefono, p.correo, p.direccion, int(p.activo), p.creado_por, p.actualizado_por))
        conn.commit()
        cur.close()
        conn.close()
        return {"mensaje": "Proveedor creado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al crear proveedores: {str(e)}")


@router.get("/{id_proveedor}", response_model=Proveedor)
def obtener_proveedores(id_proveedor: int):
    conn = get_conn()
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id_proveedor, empresa, contacto, telefono, correo, direccion, activo, creado_por, actualizado_por FROM proveedores WHERE id_proveedor = %s"
    cur.execute(sql, (id_proveedor,))
    r = cur.fetchone()
    cur.close()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    item = Proveedor(
        id_proveedor=r["id_proveedor"],
        empresa=r["empresa"],
        contacto=r["contacto"],
        telefono=r["telefono"],
        correo=r["correo"],
        direccion=r["direccion"],
        activo=bool(r["activo"]),
        creado_por=r["creado_por"],
        actualizado_por=r["actualizado_por"],
    )
    return item


@router.put("/{id_proveedor}")
def actualizar_proveedores(id_proveedor: int, p: Proveedor):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = """
            UPDATE proveedores
               SET empresa = %s,
                   contacto = %s,
                   telefono = %s,
                   correo = %s,
                   direccion = %s,
                   activo = %s,
                   actualizado_por = %s
             WHERE id_proveedor = %s
        """
        cur.execute(sql, (p.empresa, p.contacto, p.telefono, p.correo, p.direccion, int(p.activo), p.actualizado_por, id_proveedor))

        conn.commit()
        cur.close()
        conn.close()

        return {"mensaje": "Proveedor actualizado con éxito"}
    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al actualizar proveedores: {str(e)}")


@router.delete("/{id_proveedor}")
async def eliminar_proveedores(id_proveedor: int):
    try:
        conn = get_conn()
        cur = conn.cursor()

        sql = "DELETE FROM proveedores WHERE id_proveedor = %s"
        cur.execute(sql, (id_proveedor,))
        conn.commit()

        cur.close()
        conn.close()
        return {"mensaje": "Proveedor eliminado con éxito"}

    except mysql.connector.Error as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail=f"Error al eliminar proveedores: {str(e)}")
