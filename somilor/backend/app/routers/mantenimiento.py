from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Mantenimiento, EstadoMantenimiento, Vehiculo
from app.schemas import MantenimientoCreate, MantenimientoOut, MantenimientoUpdate

router = APIRouter(prefix="/mantenimiento", tags=["Mantenimiento"])


@router.get("/", response_model=List[MantenimientoOut])
def listar_mantenimientos(
    vehiculo_id: Optional[int] = None,
    estado: Optional[EstadoMantenimiento] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Mantenimiento)
    if vehiculo_id:
        q = q.filter(Mantenimiento.vehiculo_id == vehiculo_id)
    if estado:
        q = q.filter(Mantenimiento.estado == estado)
    return q.order_by(Mantenimiento.fecha_programada.asc()).offset(skip).limit(limit).all()


@router.get("/alertas")
def alertas_mantenimiento(db: Session = Depends(get_db)):
    """Retorna mantenimientos vencidos y próximos (próximos 7 días)."""
    ahora = datetime.utcnow()
    pronto = ahora + timedelta(days=7)

    vencidos = db.query(Mantenimiento).filter(
        Mantenimiento.estado == EstadoMantenimiento.programado,
        Mantenimiento.fecha_programada < ahora,
    ).all()

    proximos = db.query(Mantenimiento).filter(
        Mantenimiento.estado == EstadoMantenimiento.programado,
        Mantenimiento.fecha_programada >= ahora,
        Mantenimiento.fecha_programada <= pronto,
    ).all()

    return {
        "vencidos": len(vencidos),
        "proximos_7_dias": len(proximos),
        "detalle_vencidos": [{"id": m.id, "vehiculo_id": m.vehiculo_id, "descripcion": m.descripcion} for m in vencidos],
        "detalle_proximos": [{"id": m.id, "vehiculo_id": m.vehiculo_id, "descripcion": m.descripcion, "fecha": m.fecha_programada} for m in proximos],
    }


@router.post("/", response_model=MantenimientoOut, status_code=status.HTTP_201_CREATED)
def crear_mantenimiento(m: MantenimientoCreate, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == m.vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    db_m = Mantenimiento(**m.model_dump())
    db.add(db_m)
    db.commit()
    db.refresh(db_m)
    return db_m


@router.patch("/{mantenimiento_id}", response_model=MantenimientoOut)
def actualizar_mantenimiento(mantenimiento_id: int, update: MantenimientoUpdate, db: Session = Depends(get_db)):
    m = db.query(Mantenimiento).filter(Mantenimiento.id == mantenimiento_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(m, field, value)

    # Si se completa, actualizar estado del vehículo si estaba en taller
    if update.estado == EstadoMantenimiento.completado:
        vehiculo = db.query(Vehiculo).filter(Vehiculo.id == m.vehiculo_id).first()
        if vehiculo and vehiculo.estado.value == "taller":
            vehiculo.estado = "libre"

    db.commit()
    db.refresh(m)
    return m

@router.delete("/{mantenimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_mantenimiento(mantenimiento_id: int, db: Session = Depends(get_db)):
    m = db.query(Mantenimiento).filter(Mantenimiento.id == mantenimiento_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    db.delete(m)
    db.commit()