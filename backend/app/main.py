from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.roles import router as roles_router
from app.routers.usuarios import router as usuarios_router
from app.routers.turnos import router as turnos_router
from app.routers.asistencias import router as asistencias_router
from app.routers.clientes import router as clientes_router
from app.routers.mesas_restaurante import router as mesas_restaurante_router
from app.routers.estado_mesas import router as estado_mesas_router
from app.routers.reservas import router as reservas_router
from app.routers.categorias_menu import router as categorias_menu_router
from app.routers.items_menu import router as items_menu_router
from app.routers.ingredientes import router as ingredientes_router
from app.routers.movimientos_inventario import router as movimientos_inventario_router
from app.routers.proveedores import router as proveedores_router
from app.routers.ordenes_compra import router as ordenes_compra_router
from app.routers.items_orden_compra import router as items_orden_compra_router
from app.routers.ordenes import router as ordenes_router
from app.routers.items_orden import router as items_orden_router
from app.routers.registros_estados import router as registros_estados_router
from app.routers.estados_orden import router as estados_orden_router
from app.routers.facturas import router as facturas_router
from app.routers.promociones import router as promociones_router
from app.routers.promociones_orden import router as promociones_orden_router
from app.routers.notificaciones import router as notificaciones_router
from app.routers.dashboard import router as dashboard_router
from app.routers.caja import router as caja_router


app = FastAPI(title="Restaurant Manager API")
@app.get("/")
def inicio():
    return {
        "mensaje": "Restaurant Manager API funcionando",
        "docs": "/docs"
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(turnos_router)
app.include_router(asistencias_router)
app.include_router(clientes_router)
app.include_router(mesas_restaurante_router)
app.include_router(estado_mesas_router)
app.include_router(reservas_router)
app.include_router(categorias_menu_router)
app.include_router(items_menu_router)
app.include_router(ingredientes_router)
app.include_router(movimientos_inventario_router)
app.include_router(proveedores_router)
app.include_router(ordenes_compra_router)
app.include_router(items_orden_compra_router)
app.include_router(ordenes_router)
app.include_router(items_orden_router)
app.include_router(registros_estados_router)
app.include_router(estados_orden_router)
app.include_router(facturas_router)
app.include_router(promociones_router)
app.include_router(promociones_orden_router)
app.include_router(notificaciones_router)
app.include_router(dashboard_router)
app.include_router(caja_router)
