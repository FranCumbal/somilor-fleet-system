from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import List, Optional
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models import Generador, PrecioDiesel, ConsumoGenerador
from app.schemas import (
    GeneradorOut,
    PrecioDieselCreate, PrecioDieselOut,
    ConsumoGeneradorCreate, ConsumoGeneradorUpdate, ConsumoGeneradorOut,
)

router = APIRouter(prefix="/generacion", tags=["Generación"])


def _precio_para_fecha(db: Session, fecha: datetime) -> Optional[float]:
    """Devuelve el precio por galón vigente en la fecha indicada."""
    precio = (
        db.query(PrecioDiesel)
        .filter(PrecioDiesel.fecha_inicio <= fecha)
        .order_by(PrecioDiesel.fecha_inicio.desc())
        .first()
    )
    return precio.precio_galon if precio else None


def _enriquecer_consumo(consumo: ConsumoGenerador, db: Session) -> dict:
    """Añade costo_calculado al objeto de consumo antes de devolverlo."""
    precio = _precio_para_fecha(db, consumo.fecha)
    out = ConsumoGeneradorOut.model_validate(consumo)
    out.costo_calculado = round(consumo.galones * precio, 2) if precio else None
    return out


# ── GENERADORES (catálogo) ────────────────────────────────

@router.get("/generadores", response_model=List[GeneradorOut])
def listar_generadores(db: Session = Depends(get_db)):
    return db.query(Generador).filter(Generador.activo == True).all()


# ── PRECIOS DIESEL ────────────────────────────────────────

@router.get("/precios", response_model=List[PrecioDieselOut])
def listar_precios(db: Session = Depends(get_db)):
    return (
        db.query(PrecioDiesel)
        .order_by(PrecioDiesel.fecha_inicio.desc())
        .all()
    )


@router.get("/precios/vigente", response_model=Optional[PrecioDieselOut])
def precio_vigente(db: Session = Depends(get_db)):
    precio = (
        db.query(PrecioDiesel)
        .filter(PrecioDiesel.fecha_inicio <= datetime.utcnow())
        .order_by(PrecioDiesel.fecha_inicio.desc())
        .first()
    )
    if not precio:
        raise HTTPException(status_code=404, detail="No hay precio de diesel registrado")
    return precio


@router.post("/precios", response_model=PrecioDieselOut, status_code=status.HTTP_201_CREATED)
def crear_precio(precio: PrecioDieselCreate, db: Session = Depends(get_db)):
    db_p = PrecioDiesel(**precio.model_dump())
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    return db_p


@router.delete("/precios/{precio_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_precio(precio_id: int, db: Session = Depends(get_db)):
    p = db.query(PrecioDiesel).filter(PrecioDiesel.id == precio_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Precio no encontrado")
    db.delete(p)
    db.commit()


# ── CONSUMOS ──────────────────────────────────────────────

@router.get("/consumos", response_model=List[ConsumoGeneradorOut])
def listar_consumos(
    generador_id: Optional[int] = None,
    fecha_desde:  Optional[date] = None,
    fecha_hasta:  Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(ConsumoGenerador)
    if generador_id:
        q = q.filter(ConsumoGenerador.generador_id == generador_id)
    if fecha_desde:
        q = q.filter(cast(ConsumoGenerador.fecha, Date) >= fecha_desde)
    if fecha_hasta:
        q = q.filter(cast(ConsumoGenerador.fecha, Date) <= fecha_hasta)

    consumos = q.order_by(ConsumoGenerador.fecha.desc()).offset(skip).limit(limit).all()
    return [_enriquecer_consumo(c, db) for c in consumos]


@router.post("/consumos", response_model=ConsumoGeneradorOut, status_code=status.HTTP_201_CREATED)
def registrar_consumo(consumo: ConsumoGeneradorCreate, db: Session = Depends(get_db)):
    generador = db.query(Generador).filter(Generador.id == consumo.generador_id).first()
    if not generador:
        raise HTTPException(status_code=404, detail="Generador no encontrado")
    if consumo.galones <= 0:
        raise HTTPException(status_code=400, detail="Los galones deben ser mayor a 0")

    db_c = ConsumoGenerador(**consumo.model_dump())
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    return _enriquecer_consumo(db_c, db)


@router.patch("/consumos/{consumo_id}", response_model=ConsumoGeneradorOut)
def actualizar_consumo(consumo_id: int, update: ConsumoGeneradorUpdate, db: Session = Depends(get_db)):
    c = db.query(ConsumoGenerador).filter(ConsumoGenerador.id == consumo_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consumo no encontrado")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return _enriquecer_consumo(c, db)


@router.delete("/consumos/{consumo_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_consumo(consumo_id: int, db: Session = Depends(get_db)):
    c = db.query(ConsumoGenerador).filter(ConsumoGenerador.id == consumo_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Consumo no encontrado")
    db.delete(c)
    db.commit()


# ── DASHBOARD ─────────────────────────────────────────────

@router.get("/dashboard")
def dashboard_generacion(db: Session = Depends(get_db)):
    hoy = date.today()
    inicio_semana = hoy - timedelta(days=6)
    inicio_mes    = hoy.replace(day=1)

    generadores = db.query(Generador).filter(Generador.activo == True).all()

    def _sumar_galones(desde: date, hasta: date, gen_id: Optional[int] = None):
        q = db.query(func.sum(ConsumoGenerador.galones)).filter(
            cast(ConsumoGenerador.fecha, Date) >= desde,
            cast(ConsumoGenerador.fecha, Date) <= hasta,
        )
        if gen_id:
            q = q.filter(ConsumoGenerador.generador_id == gen_id)
        return q.scalar() or 0.0

    precio_hoy = _precio_para_fecha(db, datetime.utcnow())

    total_hoy   = _sumar_galones(hoy, hoy)
    total_semana = _sumar_galones(inicio_semana, hoy)
    total_mes   = _sumar_galones(inicio_mes, hoy)

    por_generador = []
    for g in generadores:
        galones_mes = _sumar_galones(inicio_mes, hoy, g.id)
        por_generador.append({
            "id":          g.id,
            "nombre":      g.nombre,
            "ubicacion":   g.ubicacion,
            "galones_mes": round(galones_mes, 2),
            "costo_mes":   round(galones_mes * precio_hoy, 2) if precio_hoy else None,
        })

    # Consumo diario últimos 7 días para la gráfica
    dias_espanol = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
    consumo_semanal = []
    for i in range(6, -1, -1):
        d = hoy - timedelta(days=i)
        galones_dia = _sumar_galones(d, d)
        consumo_semanal.append({
            "dia":     "Hoy" if i == 0 else dias_espanol[d.weekday()],
            "galones": round(galones_dia, 2),
            "costo":   round(galones_dia * precio_hoy, 2) if precio_hoy else None,
        })

    return {
        "precio_vigente":   precio_hoy,
        "total_hoy":        round(total_hoy, 2),
        "total_semana":     round(total_semana, 2),
        "total_mes":        round(total_mes, 2),
        "costo_hoy":        round(total_hoy * precio_hoy, 2) if precio_hoy else None,
        "costo_mes":        round(total_mes * precio_hoy, 2) if precio_hoy else None,
        "por_generador":    por_generador,
        "consumo_semanal":  consumo_semanal,
    }