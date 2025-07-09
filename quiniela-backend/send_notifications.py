# send_notifications.py
import json
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from push_notifications import send_push_message

def notify_upcoming_matches():
    db: Session = SessionLocal()

    try:
        # 1. Obtener todas las suscripciones
        subs = db.query(models.PushSubscription).all()

        # 2. Enviar una notificación de prueba a cada una
        for sub in subs:
            subscription = {
                "endpoint": sub.endpoint,
                "keys": {
                    "p256dh": sub.p256dh_key,
                    "auth": sub.auth_key,
                },
            }

            # ✅ Convertir el diccionario a JSON string
            subscription_json = json.dumps(subscription)

            send_push_message(
                subscription_json,
                "🔔 Notificación de prueba",
                "Si ves esto, las notificaciones push funcionan 🎉"
            )

    finally:
        db.close()

if __name__ == "__main__":
    notify_upcoming_matches()