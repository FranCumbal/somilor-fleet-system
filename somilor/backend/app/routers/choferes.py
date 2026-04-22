from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
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
