from app.database import SessionLocal
from app.models.models import Usuario
from passlib.context import CryptContext

# Usamos el mismo encriptador de tu sistema
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

# Buscamos al usuario
user = db.query(Usuario).filter(Usuario.email == "admin@somilor.com").first()

if user:
    # Le ponemos la contraseña 'admin123' usando el motor nativo de Python
    user.hashed_password = pwd_context.hash("admin123")
    user.activo = True
    db.commit()
    print("✅ ¡Éxito! Contraseña actualizada perfectamente a: admin123")
else:
    print("❌ El usuario admin@somilor.com no se encontró en la base de datos.")

db.close()