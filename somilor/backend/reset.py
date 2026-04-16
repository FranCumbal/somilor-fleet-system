from app.database import SessionLocal
from app.models.models import Usuario
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()

admin = db.query(Usuario).filter(Usuario.email == "admin@somilor.com").first()
if admin:
    admin.hashed_password = pwd_context.hash("Admin123!")
    db.commit()
    print("✅ Contraseña actualizada correctamente a: Admin123!")
else:
    print("❌ No se encontró el usuario")