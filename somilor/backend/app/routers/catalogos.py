from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter(
    prefix="/api/v1/catalogos",
    tags=["Catálogos"]
)

@router.get("/mantenimientos", response_model=List[schemas.CatalogoMantenimientoResponse])
def get_catalogo_mantenimientos(
    tipo_vehiculo: Optional[str] = None,
    tipo_mantenimiento: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Iniciamos la consulta
    query = db.query(models.CatalogoMantenimiento)
    
    # Filtramos si la web nos envía el tipo de vehículo (ej: 'liviano')
    if tipo_vehiculo:
        query = query.filter(models.CatalogoMantenimiento.tipo_vehiculo == tipo_vehiculo)
        
    # Filtramos si la web nos envía el tipo de mantenimiento (ej: 'preventivo')
    if tipo_mantenimiento:
        query = query.filter(models.CatalogoMantenimiento.tipo_mantenimiento == tipo_mantenimiento)
        
    return query.all()