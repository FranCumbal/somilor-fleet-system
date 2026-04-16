from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models import Tanqueo, Vehiculo
from app.schemas import TanqueoCreate, TanqueoOut

router = APIRouter(prefix="/combustible", tags=["Combustible"])

UMBRAL_ANOMALIA_PORCENTAJE = 30  # Si el rendimiento baja >30% del promedio del vehículo


def calcular_rendimiento(km_inicial, km_final, litros) -> Optional[float]:
    if km_inicial and km_final and litros and litros > 0:
        return round((km_final - km_inicial) / litros, 2)
    return None


def detectar_anomalia(db: Session, vehiculo_id: int, rendimiento: Optional[float]) -> bool:
    if rendimiento is None:
        return False
    promedio = db.query(func.avg(Tanqueo.rendimiento_km_l)).filter(
        Tanqueo.vehiculo_id == vehiculo_id,
        Tanqueo.rendimiento_km_l.isnot(None)
    ).scalar()
    if promedio and rendimiento < promedio * (1 - UMBRAL_ANOMALIA_PORCENTAJE / 100):
        return True
    return False


@router.get("/", response_model=List[TanqueoOut])
def listar_tanqueos(
    vehiculo_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    solo_anomalias: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Tanqueo)
    if vehiculo_id:
        q = q.filter(Tanqueo.vehiculo_id == vehiculo_id)
    if fecha_desde:
        q = q.filter(Tanqueo.fecha >= fecha_desde)
    if fecha_hasta:
        q = q.filter(Tanqueo.fecha <= fecha_hasta)
    if solo_anomalias:
        q = q.filter(Tanqueo.es_anomalia == True)
    return q.order_by(Tanqueo.fecha.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=TanqueoOut, status_code=status.HTTP_201_CREATED)
def registrar_tanqueo(tanqueo: TanqueoCreate, db: Session = Depends(get_db)):
    vehiculo = db.query(Vehiculo).filter(Vehiculo.id == tanqueo.vehiculo_id).first()
    if not vehiculo:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado")

    rendimiento = calcular_rendimiento(tanqueo.km_inicial, tanqueo.km_final, tanqueo.litros)
    es_anomalia = detectar_anomalia(db, tanqueo.vehiculo_id, rendimiento)

    db_t = Tanqueo(
        **tanqueo.model_dump(),
        rendimiento_km_l=rendimiento,
        es_anomalia=es_anomalia,
    )
    db.add(db_t)

    # Actualizar kilometraje del vehículo
    if tanqueo.km_final:
        vehiculo.kilometraje_actual = tanqueo.km_final
    if tanqueo.horas_final:
        vehiculo.horas_operacion = tanqueo.horas_final

    db.commit()
    db.refresh(db_t)
    return db_t


@router.get("/resumen/hoy")
def consumo_hoy(db: Session = Depends(get_db)):
    hoy = date.today()
    total = db.query(func.sum(Tanqueo.litros)).filter(
        cast(Tanqueo.fecha, Date) == hoy
    ).scalar() or 0
    return {"fecha": hoy, "litros_total": round(total, 2)}


@router.get("/resumen/por-vehiculo")
def consumo_por_vehiculo(db: Session = Depends(get_db)):
    resultados = db.query(
        Tanqueo.vehiculo_id,
        func.sum(Tanqueo.litros).label("total_litros"),
        func.avg(Tanqueo.rendimiento_km_l).label("rendimiento_promedio"),
        func.count(Tanqueo.id).label("cantidad_tanqueos"),
    ).group_by(Tanqueo.vehiculo_id).all()
    return [
        {
            "vehiculo_id": r.vehiculo_id,
            "total_litros": round(r.total_litros or 0, 2),
            "rendimiento_promedio": round(r.rendimiento_promedio or 0, 2),
            "cantidad_tanqueos": r.cantidad_tanqueos,
        }
        for r in resultados
    ]
