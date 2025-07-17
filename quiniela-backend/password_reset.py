# password_reset.py
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, Request # type: ignore
from sqlalchemy.orm import Session # type: ignore
from sqlalchemy import text # type: ignore
import models
from database import get_db
from pydantic import BaseModel # type: ignore
from passlib.context import CryptContext # type: ignore
from auth import get_current_user  # asegúrate de tener esta importación

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

FRONTEND_URL = os.getenv("FRONTEND_URL")

# ✅ Paso 1: Generar enlace de recuperación
@router.post("/generate-reset-link/")
def generate_reset_link(
    request: Request,
    email: str,
    db: Session = Depends(get_db)
):
    
    # 🔐 Protección: validar token secreto en el header
    secret = request.headers.get("X-Reset-Token")
    if secret != os.getenv("RESET_SECRET"):
        raise HTTPException(status_code=403, detail="No autorizado")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    token = str(uuid.uuid4())

    db.execute(
        text("""
            INSERT INTO password_reset_tokens (user_id, token)
            VALUES (:user_id, :token)
        """),
        {"user_id": user.id, "token": token}
    )
    db.commit()

    reset_link = f"{FRONTEND_URL}/reset-password/{token}"
    return {"reset_link": reset_link}

@router.post("/user-reset-link/")
def user_reset_link(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    token = str(uuid.uuid4())

    db.execute(
        text("""
            INSERT INTO password_reset_tokens (user_id, token)
            VALUES (:user_id, :token)
        """),
        {"user_id": current_user.id, "token": token}
    )
    db.commit()

    reset_link = f"{FRONTEND_URL}/reset-password/{token}"
    return {"reset_link": reset_link}

# ✅ Paso 2: Actualizar la contraseña
class ResetPasswordPayload(BaseModel):
    new_password: str

@router.post("/reset-password/{token}")
def reset_password(
    token: str,
    payload: ResetPasswordPayload,
    db: Session = Depends(get_db)
):
    # Buscar el token en la tabla
    reset_entry = db.execute(
        text("""
            SELECT * FROM password_reset_tokens WHERE token = :token
        """),
        {"token": token}
    ).mappings().fetchone()  # ✅ ← importante

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    if reset_entry["used"]:
        raise HTTPException(status_code=400, detail="Este enlace ya fue utilizado")

    # Obtener al usuario
    user = db.query(models.User).filter(models.User.id == reset_entry["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Hash de la nueva contraseña
    new_hash = pwd_context.hash(payload.new_password)
    user.password_hash = new_hash

    # Marcar el token como usado
    db.execute(
        text("""
            UPDATE password_reset_tokens SET used = true WHERE token = :token
        """),
        {"token": token}
    )

    db.commit()
    return {"message": "✅ Contraseña actualizada correctamente"}


# Endpoint para actualizar el nombre del usuario autenticado
class UpdateUserNamePayload(BaseModel):
    name: str

@router.put("/update-name/")
def update_name(
    payload: UpdateUserNamePayload,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = payload.name
    db.commit()
    db.refresh(current_user)
    return {"message": "Nombre actualizado correctamente", "name": current_user.name}

# Endpoint para actualizar el correo electrónico del usuario autenticado
class UpdateUserEmailPayload(BaseModel):
    email: str

@router.put("/update-email/")
def update_email(
    payload: UpdateUserEmailPayload,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verifica si el nuevo email ya está registrado
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing and existing.id != current_user.id:
        raise HTTPException(status_code=400, detail="Este correo ya está en uso")

    current_user.email = payload.email
    db.commit()
    db.refresh(current_user)
    return {"message": "Correo actualizado correctamente", "email": current_user.email}