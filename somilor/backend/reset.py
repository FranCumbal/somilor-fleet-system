from app.database import SessionLocal
from app.models.models import Usuario
from passlib.context import CryptContext

# Usamos el mismo encriptador de tu sistema
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

# ==========================================
# 1. ARREGLAR AL ADMINISTRADOR
# ==========================================
admin = db.query(Usuario).filter(Usuario.email == "admin@somilor.com").first()

if admin:
    admin.hashed_password = pwd_context.hash("admin123")
    admin.activo = True
    print("✅ Administrador (admin@somilor.com) reseteado. Nueva contraseña: admin123")
else:
    print("❌ El usuario admin@somilor.com no se encontró en la base de datos.")


# ==========================================
# 2. ARREGLAR O CREAR AL TRANSPORTISTA
# ==========================================
mantenimiento = db.query(Usuario).filter(Usuario.email == "mantenimiento@somilor.com").first()

if mantenimiento:
    mantenimiento.hashed_password = pwd_context.hash("admin123")
    mantenimiento.rol = "transportista"
    mantenimiento.activo = True
    print("✅ Transportista (mantenimiento@somilor.com) actualizado. Nueva contraseña: admin123")
else:
    nuevo_usuario = Usuario(
        nombre="Encargado Mantenimiento",
        email="mantenimiento@somilor.com",
        hashed_password=pwd_context.hash("admin123"),
        rol="transportista",
        activo=True
    )
    db.add(nuevo_usuario)
    print("✅ Transportista CREADO (mantenimiento@somilor.com). Nueva contraseña: admin123")

# Guardar los cambios en la base de datos
db.commit()
db.close()