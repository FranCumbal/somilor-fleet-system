from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models import HistorialKilometraje, Vehiculo, Usuario
from app.schemas import KilometrajeCreate, KilometrajeUpdate, KilometrajeOut
from app.routers.auth import get_current_user # Importamos la seguridad

router = APIRouter(prefix="/kilometraje", tags=["Kilometraje"])

@router.get("/", response_model=List[KilometrajeOut])
def listar_historial(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Ordenamos por creado_en para tener la hora exacta de más reciente a más antiguo
    return db.query(HistorialKilometraje).order_by(HistorialKilometraje.creado_en.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=KilometrajeOut, status_code=status.HTTP_201_CREATED)
def registrar_kilometraje(data: KilometrajeCreate, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == data.vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    # LA MAGIA: El servidor toma su propia fecha, el usuario no la envía
    fecha_hoy = date.today()

    if data.kilometraje < vehiculo.kilometraje_actual:
        raise HTTPException(status_code=400, detail=f"El kilometraje ingresado ({data.kilometraje}) es menor al actual ({vehiculo.kilometraje_actual} km).")

    # Validamos que el vehículo no tenga ya un registro hoy
    existente = db.query(HistorialKilometraje).filter(
        HistorialKilometraje.vehiculo_id == data.vehiculo_id,
        HistorialKilometraje.fecha == fecha_hoy
    ).first()

    if existente:
        raise HTTPException(status_code=400, detail="Ya se registró el kilometraje de este vehículo el día de hoy.")

    db_km = HistorialKilometraje(
        vehiculo_id=data.vehiculo_id,
        fecha=fecha_hoy,
        kilometraje=data.kilometraje,
        observaciones=data.observaciones
    )
    db.add(db_km)
    
    # Actualizamos el odómetro del vehículo
    vehiculo.kilometraje_actual = data.kilometraje
    db.commit()
    db.refresh(db_km)
    return db_km

@router.patch("/{id}", response_model=KilometrajeOut)
def editar_kilometraje(id: int, update_data: KilometrajeUpdate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    # SEGURIDAD: Solo el Admin puede editar
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Solo los administradores pueden editar.")
        
    registro = db.query(HistorialKilometraje).filter(HistorialKilometraje.id == id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    if update_data.kilometraje is not None:
        registro.kilometraje = update_data.kilometraje
        # Si se corrige el kilometraje, actualizamos el vehículo también
        vehiculo = db.query(Vehiculo).filter(Vehiculo.id == registro.vehiculo_id).first()
        if vehiculo and vehiculo.kilometraje_actual < update_data.kilometraje:
            vehiculo.kilometraje_actual = update_data.kilometraje

    if update_data.observaciones is not None:
        registro.observaciones = update_data.observaciones
        
    db.commit()
    db.refresh(registro)
    return registro

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_kilometraje(id: int, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    # SEGURIDAD: Solo el Admin puede eliminar
    if current_user.rol != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Solo los administradores pueden eliminar.")
        
    registro = db.query(HistorialKilometraje).filter(HistorialKilometraje.id == id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    db.delete(registro)
    db.commit()