from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import shutil
import os
from uuid import uuid4

from app.database import get_db
from app.models import Chofer
from app.schemas import ChoferCreate, ChoferOut

router = APIRouter(prefix="/choferes", tags=["Choferes"])


@router.get("/", response_model=List[ChoferOut])
def listar_choferes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Chofer).filter(Chofer.activo == True).order_by(Chofer.id).offset(skip).limit(limit).all()


@router.get("/{chofer_id}", response_model=ChoferOut)
def obtener_chofer(chofer_id: int, db: Session = Depends(get_db)):
    c = db.query(Chofer).filter(Chofer.id == chofer_id, Chofer.activo == True).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    return c


@router.post("/", response_model=ChoferOut, status_code=status.HTTP_201_CREATED)
def crear_chofer(chofer: ChoferCreate, db: Session = Depends(get_db)):
    existing = db.query(Chofer).filter(Chofer.cedula == chofer.cedula).first()
    if existing:
        raise HTTPException(status_code=400, detail="La cédula ya está registrada")
    db_c = Chofer(**chofer.model_dump())
    db.add(db_c)
    db.commit()
    db.refresh(db_c)
    return db_c


@router.put("/{chofer_id}", response_model=ChoferOut)
def actualizar_chofer(chofer_id: int, chofer: ChoferCreate, db: Session = Depends(get_db)):
    c = db.query(Chofer).filter(Chofer.id == chofer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    for field, value in chofer.model_dump().items():
        setattr(c, field, value)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/{chofer_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_chofer(chofer_id: int, db: Session = Depends(get_db)):
    c = db.query(Chofer).filter(Chofer.id == chofer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")
    c.activo = False
    db.commit()


# ==========================================
# NUEVO ENDPOINT PARA SUBIR FOTOS Y LICENCIAS
# ==========================================
@router.post("/{chofer_id}/upload/{tipo}", response_model=ChoferOut)
def subir_documento(chofer_id: int, tipo: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # 1. Validamos que solo intenten subir foto o licencia
    if tipo not in ["foto", "licencia"]:
        raise HTTPException(status_code=400, detail="El tipo de documento debe ser 'foto' o 'licencia'")
        
    c = db.query(Chofer).filter(Chofer.id == chofer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Chofer no encontrado")

    # 2. Generamos un nombre único para que no se sobreescriban archivos con el mismo nombre
    ext = file.filename.split(".")[-1]
    filename = f"{uuid4().hex}.{ext}"
    filepath = f"uploads/choferes/{filename}"

    # 3. Guardamos el archivo físicamente en el servidor
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 4. Guardamos la ruta en la base de datos
    url = f"/uploads/choferes/{filename}"
    
    if tipo == "foto":
        # Si ya tenía foto vieja, podríamos borrarla aquí para ahorrar espacio (opcional)
        if c.foto_url and os.path.exists(c.foto_url.lstrip("/")):
            try: os.remove(c.foto_url.lstrip("/"))
            except: pass
        c.foto_url = url
    else:
        if c.licencia_url and os.path.exists(c.licencia_url.lstrip("/")):
            try: os.remove(c.licencia_url.lstrip("/"))
            except: pass
        c.licencia_url = url
        
    db.commit()
    db.refresh(c)
    return c