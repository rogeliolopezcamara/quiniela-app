# push_notifications.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import get_db
from auth import get_current_user

router = APIRouter()

# Modelo Pydantic para validar lo que envía el frontend
class SubscriptionPayload(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str

@router.post("/subscribe")
def subscribe_to_notifications(
    payload: SubscriptionPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verifica si ya existe una suscripción con ese endpoint para este usuario
    existing = (
        db.query(models.PushSubscription)
        .filter_by(user_id=current_user.id, endpoint=payload.endpoint)
        .first()
    )

    if existing:
        existing.p256dh_key = payload.p256dh_key
        existing.auth_key = payload.auth_key
    else:
        new_sub = models.PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh_key=payload.p256dh_key,
            auth_key=payload.auth_key,
        )
        db.add(new_sub)

    db.commit()
    return {"message": "Suscripción guardada correctamente"}