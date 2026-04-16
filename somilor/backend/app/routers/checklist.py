from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import cast, Date, func
from typing import List, Optional
from datetime import date
from app.database import get_db
from app.models import Checklist, Vehiculo, Chofer
from app.schemas import ChecklistCreate, ChecklistOut

router = APIRouter(prefix="/checklist", tags=["Checklist"])

ITEMS_CRITICOS = ["extintor", "llantas", "frenos", "luces_delanteras"]


def evaluar_aprobacion(data: ChecklistCreate) -> bool:
    items = [
        data.luces_delanteras, data.luces_traseras, data.llantas,
        data.extintor, data.nivel_agua, data.nivel_aceite,
        data.bateria, data.limpiabrisas, data.bocina,
        data.espejos, data.cinturones, data.senales_emergencia,
    ]
    # Reprueba si cualquier ítem falla
    return all(items)


@router.get("/", response_model=List[ChecklistOut])
def listar_checklists(
    vehiculo_id: Optional[int] = None,
    chofer_id: Optional[int] = None,
    solo_reprobados: bool = False,
    fecha: Optional[date] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(Checklist)
    if vehiculo_id:
        q = q.filter(Checklist.vehiculo_id == vehiculo_id)
    if chofer_id:
        q = q.filter(Checklist.chofer_id == chofer_id)
    if solo_reprobados:
        q = q.filter(Checklist.aprobado == False)
    if fecha:
        q = q.filter(cast(Checklist.fecha, Date) == fecha)
    return q.order_by(Checklist.fecha.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ChecklistOut, status_code=status.HTTP_201_CREATED)
def registrar_checklist(checklist: ChecklistCreate, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == checklist.vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    chofer = db.query(Chofer).filter(Chofer.id == checklist.chofer_id).first()
    if not chofer:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    aprobado = evaluar_aprobacion(checklist)

    db_c = Checklist(**checklist.model_dump(), aprobado=aprobado)
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    return db_c


@router.get("/hoy/resumen")
def resumen_hoy(db: Session = Depends(get_db)):
    hoy = date.today()
    total = db.query(func.count(Checklist.id)).filter(cast(Checklist.fecha, Date) == hoy).scalar()
    aprobados = db.query(func.count(Checklist.id)).filter(cast(Checklist.fecha, Date) == hoy, Checklist.aprobado == True).scalar()
    reprobados = db.query(func.count(Checklist.id)).filter(cast(Checklist.fecha, Date) == hoy, Checklist.aprobado == False).scalar()
    return {"fecha": hoy, "total": total, "aprobados": aprobados, "reprobados": reprobados}
