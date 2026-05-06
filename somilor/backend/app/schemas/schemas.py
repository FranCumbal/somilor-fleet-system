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
    codigo_trabajador: Optional[str] = None 
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
    placa: str 
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio: Optional[int] = None
    color: Optional[str] = None
    tipo: TipoVehiculo
    kilometraje_actual: float = 0
    horas_operacion: float = 0
    nivel_combustible: float = 100
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
    observaciones: Optional[str] = None 
    vehiculo: VehiculoOut
    chofer: ChoferOut
    class Config: from_attributes = True


# ── TANQUEO ───────────────────────────────────

class TanqueoCreate(BaseModel):
    vehiculo_id: int
    chofer_id: Optional[int] = None
    costo_total: float
    fecha: Optional[datetime] = None  
    observaciones: Optional[str] = None

class TanqueoUpdate(BaseModel):
    vehiculo_id: Optional[int] = None
    chofer_id: Optional[int] = None
    costo_total: Optional[float] = None
    fecha: Optional[datetime] = None  
    observaciones: Optional[str] = None

class TanqueoOut(TanqueoCreate):
    id: int
    fecha: datetime
    class Config: from_attributes = True

class CatalogoMantenimientoOut(BaseModel):
    id: int
    tipo_vehiculo: str
    clase: str
    sistema: str
    descripcion: str
    frecuencia_estimada: Optional[str] = None
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
    costo: Optional[float] = None  # <--- Faltaba aquí para poder recibirlo al crear
    observaciones: Optional[str] = None

class MantenimientoUpdate(BaseModel):
    # Agregamos estos campos como opcionales para que el botón "Editar" del frontend funcione
    vehiculo_id: Optional[int] = None
    tipo: Optional[TipoMantenimiento] = None
    descripcion: Optional[str] = None
    fecha_programada: Optional[datetime] = None
    km_programado: Optional[float] = None
    horas_programado: Optional[float] = None
    taller: Optional[str] = None
    observaciones: Optional[str] = None
    estado: Optional[EstadoMantenimiento] = None
    fecha_realizado: Optional[datetime] = None
    km_realizado: Optional[float] = None
    costo: Optional[float] = None

class MantenimientoOut(MantenimientoCreate):
    id: int
    estado: EstadoMantenimiento
    fecha_realizado: Optional[datetime]
    km_realizado: Optional[float]
    creado_en: datetime
    vehiculo: VehiculoOut
    class Config: from_attributes = True


# ── CHECKLIST ─────────────────────────────────
class ChecklistCreate(BaseModel):
    vehiculo_id: int
    chofer_id: int
    turno: str = "dia"    
    luces_delanteras: Optional[bool] = None
    luces_traseras: Optional[bool] = None
    llantas: Optional[bool] = None
    extintor: Optional[bool] = None
    nivel_agua: Optional[bool] = None
    nivel_aceite: Optional[bool] = None
    bateria: Optional[bool] = None
    limpiabrisas: Optional[bool] = None
    bocina: Optional[bool] = None
    espejos: Optional[bool] = None
    cinturones: Optional[bool] = None
    senales_emergencia: Optional[bool] = None
    
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

# ── PERSONAL ──────────────────────────────────────────────
class PersonalBase(BaseModel):
    nombre:   str
    apellido: str
    codigo_trabajador: Optional[str] = None
    cargo:    Optional[str] = None
    area:     Optional[str] = None

class PersonalCreate(PersonalBase):
    pass

class PersonalOut(PersonalBase):
    id:        int
    activo:    bool
    creado_en: datetime
    class Config: from_attributes = True


# ── GENERADOR ─────────────────────────────────────────────
class GeneradorOut(BaseModel):
    id:        int
    nombre:    str
    ubicacion: Optional[str] = None
    marca:     Optional[str] = None
    activo:    bool
    class Config: from_attributes = True


# ── PRECIO DIESEL ─────────────────────────────────────────
class PrecioDieselCreate(BaseModel):
    precio_galon:  float
    fecha_inicio:  datetime
    observaciones: Optional[str] = None

class PrecioDieselOut(PrecioDieselCreate):
    id:        int
    creado_en: datetime
    class Config: from_attributes = True


# ── CONSUMO GENERADOR ─────────────────────────────────────
class ConsumoGeneradorCreate(BaseModel):
    generador_id:  int
    personal_id:   Optional[int] = None
    fecha:         datetime
    galones:       float
    observaciones: Optional[str] = None

class ConsumoGeneradorUpdate(BaseModel):
    generador_id:  Optional[int]   = None
    personal_id:   Optional[int]   = None
    fecha:         Optional[datetime] = None
    galones:       Optional[float] = None
    observaciones: Optional[str]   = None

class ConsumoGeneradorOut(ConsumoGeneradorCreate):
    id:              int
    creado_en:       datetime
    generador:       GeneradorOut
    personal:        Optional[PersonalOut] = None
    costo_calculado: Optional[float]       = None
    class Config: from_attributes = True