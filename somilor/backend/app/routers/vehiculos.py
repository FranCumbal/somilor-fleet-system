from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from uuid import uuid4

from app.database import get_db
from app.models import Vehiculo, EstadoVehiculo
from app.schemas import VehiculoCreate, VehiculoOut, VehiculoUpdate

router = APIRouter(prefix="/vehiculos", tags=["Vehículos"])


@router.get("/", response_model=List[VehiculoOut])
def listar_vehiculos(
    estado: Optional[EstadoVehiculo] = None,
    tipo: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Vehiculo).filter(Vehiculo.activo == True)
    if estado:
        q = q.filter(Vehiculo.estado == estado)
    if tipo:
        q = q.filter(Vehiculo.tipo == tipo)
    return q.order_by(Vehiculo.id).offset(skip).limit(limit).all()


@router.get("/{vehiculo_id}", response_model=VehiculoOut)
def obtener_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id, Vehiculo.activo == True).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    return v


@router.post("/", response_model=VehiculoOut, status_code=status.HTTP_201_CREATED)
def crear_vehiculo(vehiculo: VehiculoCreate, db: Session = Depends(get_db)):
    existing = db.query(Vehiculo).filter(Vehiculo.placa == vehiculo.placa).first()
    if existing:
        raise HTTPException(status_code=400, detail="Esta placa ya está registrada")
    db_v = Vehiculo(**vehiculo.model_dump())
    db.add(db_v)
    db.commit()
    db.refresh(db_v)
    return db_v


@router.patch("/{vehiculo_id}", response_model=VehiculoOut)
def actualizar_vehiculo(vehiculo_id: int, update: VehiculoUpdate, db: Session = Depends(get_db)):
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(v, field, value)
    db.commit()
    db.refresh(v)
    return v


@router.delete("/{vehiculo_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_vehiculo(vehiculo_id: int, db: Session = Depends(get_db)):
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    v.activo = False
    db.commit()

@router.post("/{vehiculo_id}/upload/{tipo}", response_model=VehiculoOut)
def subir_documento(vehiculo_id: int, tipo: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if tipo not in ["foto", "matricula"]:
        raise HTTPException(status_code=400, detail="El tipo de documento debe ser 'foto' o 'matricula'")
        
    v = db.query(Vehiculo).filter(Vehiculo.id == vehiculo_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    ext = file.filename.split(".")[-1]
    filename = f"{uuid4().hex}.{ext}"
    filepath = f"uploads/vehiculos/{filename}"

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    url = f"/uploads/vehiculos/{filename}"
    
    if tipo == "foto":
        if v.foto_url and os.path.exists(v.foto_url.lstrip("/")):
            try: os.remove(v.foto_url.lstrip("/"))
            except: pass
        v.foto_url = url
    else:
        if v.matricula_url and os.path.exists(v.matricula_url.lstrip("/")):
            try: os.remove(v.matricula_url.lstrip("/"))
            except: pass
        v.matricula_url = url
        
    db.commit()
    db.refresh(v)
    return v