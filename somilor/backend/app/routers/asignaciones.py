from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Asignacion, Vehiculo, Chofer
from app.schemas import AsignacionCreate, AsignacionOut

router = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])

@router.get("/", response_model=List[AsignacionOut])
def listar_asignaciones(activa: Optional[bool] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    q = db.query(Asignacion)
    if activa is not None:
        q = q.filter(Asignacion.activa == activa)
    # Ordenamos para que las activas salgan primero, y luego las más recientes
    return q.order_by(Asignacion.activa.desc(), Asignacion.fecha_inicio.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=AsignacionOut, status_code=status.HTTP_201_CREATED)
def crear_asignacion(asignacion: AsignacionCreate, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == asignacion.vehiculo_id).first()
    chofer = db.query(Chofer).filter(Chofer.id == asignacion.chofer_id).first()
    
    if not vehiculo: raise HTTPException(status_code=404, detail="Vehículo no encontrado")
    if not chofer: raise HTTPException(status_code=404, detail="Chofer no encontrado")
    
    if vehiculo.estado == "taller":
        raise HTTPException(status_code=400, detail="No se puede asignar un vehículo que está en el taller")
        
    # Regla de negocio: Desactivar cualquier asignación previa que tengan este vehículo o este chofer
    db.query(Asignacion).filter(Asignacion.vehiculo_id == vehiculo.id, Asignacion.activa == True).update({"activa": False, "fecha_fin": datetime.utcnow()})
    db.query(Asignacion).filter(Asignacion.chofer_id == chofer.id, Asignacion.activa == True).update({"activa": False, "fecha_fin": datetime.utcnow()})

    # Crear la nueva asignación
    db_a = Asignacion(
        vehiculo_id=asignacion.vehiculo_id,
        chofer_id=asignacion.chofer_id,
        observaciones=asignacion.observaciones,
        activa=True
    )
    # Magia de automatización: El vehículo pasa a estar operativo
    vehiculo.estado = "operativo"
    
    db.add(db_a)
    db.commit()
    db.refresh(db_a)
    return db_a

@router.patch("/{asignacion_id}/terminar", response_model=AsignacionOut)
def terminar_asignacion(asignacion_id: int, db: Session = Depends(get_db)):
    a = db.query(Asignacion).filter(Asignacion.id == asignacion_id).first()
    if not a: raise HTTPException(status_code=404, detail="Asignación no encontrada")
    
    a.activa = False
    a.fecha_fin = datetime.utcnow()
    
    # Magia de automatización: Si el vehículo no se dañó y no está en taller, vuelve a quedar libre
    if a.vehiculo.estado != "taller":
        a.vehiculo.estado = "libre"
        
    db.commit()
    db.refresh(a)
    return a