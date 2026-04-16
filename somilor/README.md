# 🚛 SOMILOR — Sistema de Gestión de Flotas

Sistema integral para control y monitoreo de flota vehicular minera.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Base de datos | SQL Server 2019+ |
| Backend API | Python 3.11 + FastAPI |
| Frontend | React 18 + Vite + Tailwind CSS |
| ORM | SQLAlchemy 2.0 + Alembic |
| Autenticación | JWT (python-jose) |

## Estructura del Proyecto

```
somilor/
├── backend/          # API REST FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Esquemas Pydantic
│   │   ├── routers/      # Endpoints por módulo
│   │   └── services/     # Lógica de negocio
│   ├── requirements.txt
│   └── .env.example
├── frontend/         # SPA React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/     # Llamadas a la API
│   │   └── hooks/
│   ├── package.json
│   └── vite.config.js
└── database/
    ├── migrations/   # Scripts SQL ordenados
    └── seeds/        # Datos de prueba
```

## Inicio Rápido

### 1. Base de datos (SQL Server)
```sql
-- Ejecutar en orden:
-- database/migrations/001_create_schema.sql
-- database/migrations/002_create_tables.sql
-- database/seeds/001_seed_data.sql
```

### 2. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # Editar con tus credenciales
uvicorn app.main:app --reload --port 8000
```
API disponible en: http://localhost:8000  
Docs Swagger: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env          # Editar VITE_API_URL si cambia el puerto
npm run dev
```
App disponible en: http://localhost:5173

## Módulos del Sistema

- **Flota** — Catálogo de vehículos y maquinaria
- **Choferes** — Directorio y asignaciones
- **Combustible** — Tanqueos, rendimiento y anomalías
- **Mantenimiento** — Preventivo, correctivo e historial
- **Checklist** — Pre-operacional digital
- **Dashboard** — KPIs y analítica en tiempo real

## Variables de Entorno (.env)

```env
# Backend
DATABASE_URL=mssql+pyodbc://user:pass@server/SOMILOR?driver=ODBC+Driver+17+for+SQL+Server
SECRET_KEY=tu-clave-secreta-jwt
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
```
