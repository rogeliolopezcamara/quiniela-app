# password_reset.py
import uuid
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import models
from database import get_db

router = APIRouter()

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
        """
        INSERT INTO password_reset_tokens (user_id, token)
        VALUES (:user_id, :token)
        """,
        {"user_id": user.id, "token": token}
    )
    db.commit()

    reset_link = f"https://quiniela-frontend.onrender.com/reset-password/{token}"
    return {"reset_link": reset_link}

from pydantic import BaseModel
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
        """
        SELECT * FROM password_reset_tokens WHERE token = :token
        """,
        {"token": token}
    ).fetchone()

    if not reset_entry:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    # Verificar si el token ya fue usado
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
        """
        UPDATE password_reset_tokens SET used = true WHERE token = :token
        """,
        {"token": token}
    )

    db.commit()
    return {"message": "✅ Contraseña actualizada correctamente"}