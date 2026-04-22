from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models import EstadoVehiculo, TipoVehiculo, TipoMantenimiento, EstadoMantenimiento


# ── AUTH ──────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: str = "operador"

class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool
    class Config: from_attributes = True


# ── CHOFER ────────────────────────────────────
class ChoferBase(BaseModel):
    nombre: str
    apellido: str
    cedula: str
    licencia: Optional[str] = None
    categoria_licencia: Optional[str] = None
    telefono: Optional[str] = None

class ChoferCreate(ChoferBase): pass

class ChoferOut(ChoferBase):
    id: int
    activo: bool
    creado_en: datetime
    class Config: from_attributes = True


# ── VEHICULO ──────────────────────────────────
class VehiculoBase(BaseModel):
    codigo: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    placa: Optional[str] = None
    color: Optional[str] = None
    tipo: TipoVehiculo
    kilometraje_actual: float = 0
    horas_operacion: float = 0
    nivel_combustible: float = 100

class VehiculoCreate(VehiculoBase): pass

class VehiculoUpdate(BaseModel):
    estado: Optional[EstadoVehiculo] = None
    kilometraje_actual: Optional[float] = None
    horas_operacion: Optional[float] = None
    nivel_combustible: Optional[float] = None

class VehiculoOut(VehiculoBase):
    id: int
    estado: EstadoVehiculo
    activo: bool
    creado_en: datetime
    class Config: from_attributes = True


# ── ASIGNACION ────────────────────────────────
class AsignacionCreate(BaseModel):
    vehiculo_id: int
    chofer_id: int
    observaciones: Optional[str] = None

class AsignacionOut(BaseModel):
    id: int
    vehiculo_id: int
    chofer_id: int
    fecha_inicio: datetime
    fecha_fin: Optional[datetime]
    activa: bool
    vehiculo: VehiculoOut
    chofer: ChoferOut
    class Config: from_attributes = True


# ── TANQUEO ───────────────────────────────────
class TanqueoCreate(BaseModel):
    vehiculo_id: int
    chofer_id: Optional[int] = None
    litros: float
    km_inicial: Optional[float] = None
    km_final: Optional[float] = None
    horas_inicial: Optional[float] = None
    horas_final: Optional[float] = None
    costo_total: Optional[float] = None
    precio_litro: Optional[float] = None
    observaciones: Optional[str] = None

class TanqueoUpdate(BaseModel):
    litros: Optional[float] = None
    km_inicial: Optional[float] = None
    km_final: Optional[float] = None
    horas_inicial: Optional[float] = None
    horas_final: Optional[float] = None
    precio_litro: Optional[float] = None
    observaciones: Optional[str] = None

class TanqueoOut(TanqueoCreate):
    id: int
    fecha: datetime
    rendimiento_km_l: Optional[float]
    es_anomalia: bool
    class Config: from_attributes = True


# ── MANTENIMIENTO ─────────────────────────────
class MantenimientoCreate(BaseModel):
    vehiculo_id: int
    tipo: TipoMantenimiento
    descripcion: str
    fecha_programada: Optional[datetime] = None
    km_programado: Optional[float] = None
    horas_programado: Optional[float] = None
    taller: Optional[str] = None
    observaciones: Optional[str] = None

class MantenimientoUpdate(BaseModel):
    estado: Optional[EstadoMantenimiento] = None
    fecha_realizado: Optional[datetime] = None
    km_realizado: Optional[float] = None
    costo: Optional[float] = None

class MantenimientoOut(MantenimientoCreate):
    id: int
    estado: EstadoMantenimiento
    fecha_realizado: Optional[datetime]
    km_realizado: Optional[float]
    costo: Optional[float]
    creado_en: datetime
    vehiculo: VehiculoOut
    class Config: from_attributes = True


# ── CHECKLIST ─────────────────────────────────
class ChecklistCreate(BaseModel):
    vehiculo_id: int
    chofer_id: int
    turno: str = "dia"
    luces_delanteras: bool
    luces_traseras: bool
    llantas: bool
    extintor: bool
    nivel_agua: bool
    nivel_aceite: bool
    bateria: bool
    limpiabrisas: bool
    bocina: bool
    espejos: bool
    cinturones: bool
    senales_emergencia: bool
    observaciones: Optional[str] = None

class ChecklistUpdate(BaseModel):
    turno: Optional[str] = None
    observaciones: Optional[str] = None
    luces_delanteras: Optional[bool] = None
    # Añadir el resto de items si se requiere actualización profunda

class ChecklistOut(ChecklistCreate):
    id: int
    fecha: datetime
    aprobado: Optional[bool]
    vehiculo: VehiculoOut
    chofer: ChoferOut
    class Config: from_attributes = True


# ── DASHBOARD ─────────────────────────────────
class DashboardKPIs(BaseModel):
    vehiculos_operativos: int
    vehiculos_taller: int
    vehiculos_libres: int
    total_vehiculos: int
    choferes_activos: int
    combustible_hoy_litros: float
    mantenimientos_vencidos: int
    mantenimientos_proximos: int
    checklists_reprobados_hoy: int
