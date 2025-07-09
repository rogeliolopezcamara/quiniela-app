# send_notifications.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from push_notifications import send_push_message

def notify_upcoming_matches():
    db: Session = SessionLocal()

    try:
        now = datetime.utcnow()
        in_24_hours = now + timedelta(hours=24)

        # 1. Buscar partidos que comienzan entre ahora y dentro de 24 horas
        matches = db.query(models.Match).filter(
            models.Match.match_date.between(now, in_24_hours)
        ).all()

        for match in matches:
            # 2. Buscar usuarios sin pronóstico para este partido
            subquery = db.query(models.Prediction.user_id).filter(
                models.Prediction.match_id == match.id
            )
            users = db.query(models.User).filter(~models.User.id.in_(subquery)).all()

            for user in users:
                # 3. Obtener suscripciones activas
                subs = db.query(models.PushSubscription).filter(
                    models.PushSubscription.user_id == user.id
                ).all()

                # 4. Enviar notificación
                for sub in subs:
                    subscription = {
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh_key,
                            "auth": sub.auth_key,
                        },
                    }

                    send_push_message(
                        subscription,
                        f"⚽ {match.home_team} vs {match.away_team}",
                        "¡Haz tu pronóstico antes de que comience el partido mañana!"
                    )

    finally:
        db.close()

if __name__ == "__main__":
    notify_upcoming_matches()