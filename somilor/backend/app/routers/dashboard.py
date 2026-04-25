from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date, desc
from datetime import date, datetime, timedelta
from app.database import get_db

# Asegúrate de tener importados todos tus modelos, incluyendo Asignacion
from app.models import Vehiculo, Chofer, Tanqueo, Mantenimiento, Checklist, Asignacion

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis")
def obtener_kpis(db: Session = Depends(get_db)):
    hoy = date.today()
    ahora = datetime.utcnow()
    hace_7_dias = hoy - timedelta(days=6)

    # ==========================================
    # 1. KPIs BÁSICOS
    # ==========================================
    operativos = db.query(func.count(Vehiculo.id)).filter(Vehiculo.estado == 'operativo', Vehiculo.activo == True).scalar() or 0
    taller = db.query(func.count(Vehiculo.id)).filter(Vehiculo.estado == 'en_taller', Vehiculo.activo == True).scalar() or 0
    libres = db.query(func.count(Vehiculo.id)).filter(Vehiculo.estado == 'libre', Vehiculo.activo == True).scalar() or 0
    choferes_activos = db.query(func.count(Chofer.id)).filter(Chofer.activo == True).scalar() or 0

    # ==========================================
    # 2. COMBUSTIBLE (Hoy y Semana)
    # ==========================================
    combustible_hoy = db.query(func.sum(Tanqueo.costo_total)).filter(cast(Tanqueo.fecha, Date) == hoy).scalar() or 0

    # Agrupamos los costos de los últimos 7 días
    tanqueos_semana = db.query(
        cast(Tanqueo.fecha, Date).label('fecha'),
        func.sum(Tanqueo.costo_total).label('total')
    ).filter(cast(Tanqueo.fecha, Date) >= hace_7_dias).group_by(cast(Tanqueo.fecha, Date)).all()

    costos_por_dia = {t.fecha: float(t.total) for t in tanqueos_semana}
    dias_espanol = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    
    fuel_data = []
    for i in range(6, -1, -1):
        d = hoy - timedelta(days=i)
        nombre = 'Hoy' if i == 0 else dias_espanol[d.weekday()]
        fuel_data.append({
            "dia": nombre,
            "costo": costos_por_dia.get(d, 0.0) # Si no hubo tanqueo ese día, pone 0
        })

    # ==========================================
    # 3. LISTA DE FLOTA (Cruzando con Choferes)
    # ==========================================
    flota_db = db.query(Vehiculo).filter(Vehiculo.activo == True).all()
    flota_completa = []
    
    for v in flota_db:
        # Buscamos quién tiene asignado este vehículo actualmente
        asignacion = db.query(Asignacion).filter(Asignacion.vehiculo_id == v.id, Asignacion.activa == True).first()
        responsable = "Sin asignar"
        
        if asignacion:
            chofer = db.query(Chofer).filter(Chofer.id == asignacion.chofer_id).first()
            if chofer:
                responsable = f"{chofer.nombre} {chofer.apellido}"

        flota_completa.append({
            "placa": v.placa or v.codigo,
            "modelo": f"{v.marca} {v.modelo or ''}".strip(),
            "estado": v.estado.capitalize() if v.estado else 'Desconocido',
            "responsable": responsable
        })

    # ==========================================
    # 4. MANTENIMIENTOS
    # ==========================================
    mants_db = db.query(Mantenimiento, Vehiculo).join(Vehiculo).filter(
        Mantenimiento.estado.in_(['programado', 'vencido'])
    ).all()
    
    mantenimientos_data = []
    for m, v in mants_db:
        km_visual = f"{v.kilometraje_actual} km" if v.kilometraje_actual > 0 else f"{v.horas_operacion} h"
        mantenimientos_data.append({
            "placa": v.placa or v.codigo,
            "vehiculo": f"{v.marca} {v.modelo or ''}".strip(),
            "desc": m.descripcion,
            "estado": m.estado,
            "info": f"Prog: {m.fecha_programada.strftime('%d/%m/%Y')}" if m.fecha_programada else "Sin fecha",
            "kilometraje": km_visual,
            "responsable": m.taller or 'Taller Interno'
        })

    # ==========================================
    # 5. ALERTAS (Checklists y Anomalías)
    # ==========================================
    alertas = []
    
    # Checklists reprobados (Últimos 5)
    checklists = db.query(Checklist, Vehiculo).join(Vehiculo).filter(
        Checklist.aprobado == False
    ).order_by(desc(Checklist.fecha)).limit(5).all()

    for c, v in checklists:
        alertas.append({
            "tipo": "red",
            "titulo": f"Checklist reprobado — {v.placa or v.codigo}",
            "desc": c.observaciones or "Fallas reportadas por el chofer",
            "tiempo": c.fecha.strftime('%d/%m %H:%M')
        })

    # Anomalías de Combustible (Últimas 5)
    anomalias = db.query(Tanqueo, Vehiculo).join(Vehiculo).filter(
        Tanqueo.es_anomalia == True
    ).order_by(desc(Tanqueo.fecha)).limit(5).all()

    for t, v in anomalias:
        alertas.append({
            "tipo": "amber",
            "titulo": f"Anomalía Combustible — {v.placa or v.codigo}",
            "desc": f"Carga atípica de {t.litros} L (${t.costo_total})",
            "tiempo": t.fecha.strftime('%d/%m %H:%M')
        })

    # Empaquetamos absolutamente todo en un solo JSON estructurado
    return {
        "vehiculos_operativos": operativos,
        "vehiculos_taller": taller,
        "vehiculos_libres": libres,
        "choferes_activos": choferes_activos,
        "combustible_hoy_costo": round(combustible_hoy, 2),
        "consumo_semana": fuel_data,
        "flota_completa": flota_completa,
        "mantenimientos_data": mantenimientos_data,
        "alertas": alertas
    }