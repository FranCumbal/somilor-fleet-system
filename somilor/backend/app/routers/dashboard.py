from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import date
from app.database import get_db
from app.models import Vehiculo, Chofer, Tanqueo, Mantenimiento, Checklist, EstadoVehiculo, EstadoMantenimiento
from app.schemas import DashboardKPIs
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs)
def obtener_kpis(db: Session = Depends(get_db)):
    hoy = date.today()
    ahora = datetime.utcnow()
    pronto = ahora + timedelta(days=7)

    operativos = db.query(func.count(Vehiculo.id)).filter(
        Vehiculo.estado == EstadoVehiculo.operativo, Vehiculo.activo == True).scalar()
    taller = db.query(func.count(Vehiculo.id)).filter(
        Vehiculo.estado == EstadoVehiculo.taller, Vehiculo.activo == True).scalar()
    libres = db.query(func.count(Vehiculo.id)).filter(
        Vehiculo.estado == EstadoVehiculo.libre, Vehiculo.activo == True).scalar()
    total = db.query(func.count(Vehiculo.id)).filter(Vehiculo.activo == True).scalar()

    choferes_activos = db.query(func.count(Chofer.id)).filter(Chofer.activo == True).scalar()

    combustible_hoy = db.query(func.sum(Tanqueo.litros)).filter(
        cast(Tanqueo.fecha, Date) == hoy).scalar() or 0

    mant_vencidos = db.query(func.count(Mantenimiento.id)).filter(
        Mantenimiento.estado == EstadoMantenimiento.programado,
        Mantenimiento.fecha_programada < ahora).scalar()

    mant_proximos = db.query(func.count(Mantenimiento.id)).filter(
        Mantenimiento.estado == EstadoMantenimiento.programado,
        Mantenimiento.fecha_programada >= ahora,
        Mantenimiento.fecha_programada <= pronto).scalar()

    checklists_reprobados = db.query(func.count(Checklist.id)).filter(
        cast(Checklist.fecha, Date) == hoy,
        Checklist.aprobado == False).scalar()

    return DashboardKPIs(
        vehiculos_operativos=operativos or 0,
        vehiculos_taller=taller or 0,
        vehiculos_libres=libres or 0,
        total_vehiculos=total or 0,
        choferes_activos=choferes_activos or 0,
        combustible_hoy_litros=round(combustible_hoy, 2),
        mantenimientos_vencidos=mant_vencidos or 0,
        mantenimientos_proximos=mant_proximos or 0,
        checklists_reprobados_hoy=checklists_reprobados or 0,
    )
