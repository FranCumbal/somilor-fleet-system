from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import Tanqueo, Vehiculo
from app.schemas import TanqueoCreate, TanqueoOut, TanqueoUpdate

router = APIRouter(prefix="/combustible", tags=["Combustible Financiero"])

@router.get("/", response_model=List[TanqueoOut])
def listar_tanqueos(
    vehiculo_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Tanqueo)
    if vehiculo_id:
        q = q.filter(Tanqueo.vehiculo_id == vehiculo_id)
    return q.order_by(Tanqueo.fecha.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=TanqueoOut, status_code=status.HTTP_201_CREATED)
def registrar_gasto(tanqueo: TanqueoCreate, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == tanqueo.vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    db_t = Tanqueo(**tanqueo.model_dump())
    db.add(db_t)
    db.commit()
    db.refresh(db_t)
    return db_t

@router.get("/resumen/hoy")
def gasto_hoy(db: Session = Depends(get_db)):
    hoy = date.today()
    total = db.query(func.sum(Tanqueo.costo_total)).filter(
        cast(Tanqueo.fecha, Date) == hoy
    ).scalar() or 0
    return {"fecha": hoy, "litros_total": round(total, 2)} # Mantenemos la llave para no romper el front, pero envía el costo

@router.patch("/{tanqueo_id}", response_model=TanqueoOut)
def actualizar_gasto(tanqueo_id: int, update: TanqueoUpdate, db: Session = Depends(get_db)):
    t = db.query(Tanqueo).filter(Tanqueo.id == tanqueo_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(t, field, value)
    db.commit()
    db.refresh(t)
    return t

@router.delete("/{tanqueo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_gasto(tanqueo_id: int, db: Session = Depends(get_db)):
    t = db.query(Tanqueo).filter(Tanqueo.id == tanqueo_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    db.delete(t)
    db.commit()