from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base


class EstadoVehiculo(str, enum.Enum):
    operativo = "operativo"
    taller = "taller"
    libre = "libre"

class TipoVehiculo(str, enum.Enum):
    liviano = "liviano"
    pesado = "pesado"
    maquinaria = "maquinaria"

class TipoMantenimiento(str, enum.Enum):
    preventivo = "preventivo"
    correctivo = "correctivo"

class EstadoMantenimiento(str, enum.Enum):
    programado = "programado"
    en_proceso = "en_proceso"
    completado = "completado"
    vencido = "vencido"


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(String(50), default="operador")  # admin, operador, chofer
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())


class Chofer(Base):
    __tablename__ = "choferes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    cedula = Column(String(20), unique=True, index=True)
    codigo_trabajador = Column(String(50))
    categoria_licencia = Column(String(10))
    telefono = Column(String(20))
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    asignaciones = relationship("Asignacion", back_populates="chofer")
    checklists = relationship("Checklist", back_populates="chofer")


class Vehiculo(Base):
    __tablename__ = "vehiculos"
    id = Column(Integer, primary_key=True, index=True)
    placa = Column(String(20), unique=True, index=True, nullable=False) # AHORA ES LA REINA
    marca = Column(String(80))
    modelo = Column(String(80))
    anio = Column(Integer)
    color = Column(String(50))
    tipo = Column(Enum(TipoVehiculo), nullable=False)
    estado = Column(Enum(EstadoVehiculo), default=EstadoVehiculo.libre)
    kilometraje_actual = Column(Float, default=0)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), onupdate=func.now())

    asignaciones = relationship("Asignacion", back_populates="vehiculo")
    tanqueos = relationship("Tanqueo", back_populates="vehiculo")
    mantenimientos = relationship("Mantenimiento", back_populates="vehiculo")
    checklists = relationship("Checklist", back_populates="vehiculo")


class Asignacion(Base):
    __tablename__ = "asignaciones"
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    chofer_id = Column(Integer, ForeignKey("choferes.id"), nullable=False)
    fecha_inicio = Column(DateTime(timezone=True), server_default=func.now())
    fecha_fin = Column(DateTime(timezone=True), nullable=True)
    activa = Column(Boolean, default=True)
    observaciones = Column(Text)

    vehiculo = relationship("Vehiculo", back_populates="asignaciones")
    chofer = relationship("Chofer", back_populates="asignaciones")


class Tanqueo(Base):
    __tablename__ = "tanqueos"
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    chofer_id = Column(Integer, ForeignKey("choferes.id"), nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    costo_total = Column(Float, nullable=False) # Ahora este es el protagonista
    observaciones = Column(Text)

    vehiculo = relationship("Vehiculo", back_populates="tanqueos")


class Mantenimiento(Base):
    __tablename__ = "mantenimientos"
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    tipo = Column(Enum(TipoMantenimiento), nullable=False)
    estado = Column(Enum(EstadoMantenimiento), default=EstadoMantenimiento.programado)
    descripcion = Column(String(255), nullable=False)
    fecha_programada = Column(DateTime(timezone=True))
    fecha_realizado = Column(DateTime(timezone=True), nullable=True)
    km_programado = Column(Float)
    costo = Column(Float, nullable=True)
    km_realizado = Column(Float, nullable=True)
    horas_programado = Column(Float)
    costo = Column(Float)
    taller = Column(String(150))
    observaciones = Column(Text)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    vehiculo = relationship("Vehiculo", back_populates="mantenimientos")


class Checklist(Base):
    __tablename__ = "checklists"
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    chofer_id = Column(Integer, ForeignKey("choferes.id"), nullable=False)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
    turno = Column(String(20), default="dia")  # dia / noche
    aprobado = Column(Boolean, nullable=True)  # None = pendiente

    # Items del checklist (True=OK, False=FALLA, None=no inspeccionado)
    luces_delanteras = Column(Boolean)
    luces_traseras = Column(Boolean)
    llantas = Column(Boolean)
    extintor = Column(Boolean)
    nivel_agua = Column(Boolean)
    nivel_aceite = Column(Boolean)
    bateria = Column(Boolean)
    limpiabrisas = Column(Boolean)
    bocina = Column(Boolean)
    espejos = Column(Boolean)
    cinturones = Column(Boolean)
    senales_emergencia = Column(Boolean)

    observaciones = Column(Text)

    vehiculo = relationship("Vehiculo", back_populates="checklists")
    chofer = relationship("Chofer", back_populates="checklists")

class CatalogoMantenimiento(Base):
    __tablename__ = "catalogo_mantenimientos"
    id = Column(Integer, primary_key=True, index=True)
    tipo_vehiculo = Column(String(50), nullable=False)
    clase = Column(String(20), nullable=False)   
    sistema = Column(String(100), nullable=False) 
    descripcion = Column(String(255), nullable=False)
    frecuencia_estimada = Column(String(100), nullable=True)

class Personal(Base):
    __tablename__ = "personal"

    id        = Column(Integer, primary_key=True, index=True)
    nombre    = Column(String(100), nullable=False)
    apellido  = Column(String(100), nullable=False)
    codigo_trabajador = Column(String(20), nullable=True)
    cargo     = Column(String(100))
    area      = Column(String(100))
    activo    = Column(Boolean, default=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    consumos  = relationship("ConsumoGenerador", back_populates="personal")


class Generador(Base):
    __tablename__ = "generadores"

    id        = Column(Integer, primary_key=True, index=True)
    nombre    = Column(String(100), nullable=False)
    ubicacion = Column(String(150))
    marca     = Column(String(80))
    activo    = Column(Boolean, default=True)

    consumos  = relationship("ConsumoGenerador", back_populates="generador")


class PrecioDiesel(Base):
    __tablename__ = "precios_diesel"

    id            = Column(Integer, primary_key=True, index=True)
    precio_galon  = Column(Float, nullable=False)
    fecha_inicio  = Column(DateTime(timezone=True), nullable=False)
    observaciones = Column(Text)
    creado_en     = Column(DateTime(timezone=True), server_default=func.now())


class ConsumoGenerador(Base):
    __tablename__ = "consumos_generador"

    id           = Column(Integer, primary_key=True, index=True)
    generador_id = Column(Integer, ForeignKey("generadores.id"), nullable=False)
    personal_id  = Column(Integer, ForeignKey("personal.id"), nullable=True)
    fecha        = Column(DateTime(timezone=True), nullable=False)
    galones      = Column(Float, nullable=False)
    observaciones = Column(Text)
    creado_en    = Column(DateTime(timezone=True), server_default=func.now())

    generador = relationship("Generador", back_populates="consumos")
    personal  = relationship("Personal", back_populates="consumos")

class HistorialKilometraje(Base):
    __tablename__ = "historial_kilometraje"
    id = Column(Integer, primary_key=True, index=True)
    vehiculo_id = Column(Integer, ForeignKey("vehiculos.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    kilometraje = Column(Float, nullable=False)
    observaciones = Column(Text)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    vehiculo = relationship("Vehiculo")