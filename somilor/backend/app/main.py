from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import Base, engine
# Importamos los routers con los nombres que ya tienes en tu carpeta
from app.routers import auth, vehiculos, choferes, combustible, mantenimiento, checklist, dashboard, catalogos

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SOMILOR Fleet API",
    description="API REST para el Sistema de Gestión de Flotas SOMILOR",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PREFIX = "/api/v1"

# Registro de rutas (routers)
app.include_router(auth.router, prefix=PREFIX)
app.include_router(vehiculos.router, prefix=PREFIX)
app.include_router(choferes.router, prefix=PREFIX)
app.include_router(combustible.router, prefix=PREFIX)
app.include_router(mantenimiento.router, prefix=PREFIX)
app.include_router(checklist.router, prefix=PREFIX)
app.include_router(dashboard.router, prefix=PREFIX)
# El catálogo lo registramos bajo el mismo prefijo
app.include_router(catalogos.router, prefix=PREFIX)

@app.get("/")
def root():
    return {"sistema": "SOMILOR Fleet Management", "version": "1.0.0", "docs": "/docs"}