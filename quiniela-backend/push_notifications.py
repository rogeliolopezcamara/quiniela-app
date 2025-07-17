# push_notifications.py
from fastapi import APIRouter, Depends, HTTPException # type: ignore
from sqlalchemy.orm import Session # type: ignore
from pydantic import BaseModel # type: ignore
import models
from database import get_db
from auth import get_current_user
from pywebpush import webpush, WebPushException # type: ignore
import os
import json
from sqlalchemy import text # type: ignore

router = APIRouter()

# ✅ Modelo actualizado para coincidir con lo que envía el frontend
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
    return {"message": "✅ Suscripción guardada correctamente"}

def send_push_message(subscription, title, body):
    try:
        webpush(
            subscription_info=json.loads(subscription),
            data=json.dumps({"title": title, "body": body}),
            vapid_private_key=os.getenv("VAPID_PRIVATE_KEY"),
            vapid_claims={
                "sub": "mailto:admin@tu-app.com"
            }
        )
        print(f"✅ Notificación enviada: {title}")
    except WebPushException as ex:
        print("❌ Error al enviar push:", repr(ex))