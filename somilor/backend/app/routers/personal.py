from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import Personal
from app.schemas import PersonalCreate, PersonalOut

router = APIRouter(prefix="/personal", tags=["Personal"])


@router.get("/", response_model=List[PersonalOut])
def listar_personal(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(Personal)
        .filter(Personal.activo == True)
        .order_by(Personal.apellido)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{personal_id}", response_model=PersonalOut)
def obtener_personal(personal_id: int, db: Session = Depends(get_db)):
    p = db.query(Personal).filter(Personal.id == personal_id, Personal.activo == True).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    return p


@router.post("/", response_model=PersonalOut, status_code=status.HTTP_201_CREATED)
def crear_personal(persona: PersonalCreate, db: Session = Depends(get_db)):
    db_p = Personal(**persona.model_dump())
    db.add(db_p)
    db.commit()
    db.refresh(db_p)
    return db_p


@router.put("/{personal_id}", response_model=PersonalOut)
def actualizar_personal(personal_id: int, persona: PersonalCreate, db: Session = Depends(get_db)):
    p = db.query(Personal).filter(Personal.id == personal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    for field, value in persona.model_dump().items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{personal_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_personal(personal_id: int, db: Session = Depends(get_db)):
    p = db.query(Personal).filter(Personal.id == personal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    p.activo = False
    db.commit()