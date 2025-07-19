# send_notifications.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session # type: ignore
from database import SessionLocal
import models
from push_notifications import send_push_message
import json

def notify_upcoming_matches(db: Session):  # 👈 recibe db como argumento
    try:
        now = datetime.utcnow()

        upper_bound_24h = now + timedelta(hours=24)

        matches = db.query(models.Match).filter(
            models.Match.match_date <= now + timedelta(hours=1)
        ).all()

        for match in matches:
            seconds_until = (match.match_date - now).total_seconds()

            if 0 < seconds_until <= 3600:
                notif_type = "1h"
                body = f"⚠️ Último aviso: {match.home_team} vs {match.away_team} comienza en menos de 1 hora."
            elif 3600 < seconds_until <= 86400:
                notif_type = "24h"
                body = f"⏰ El partido empieza mañana: {match.home_team} vs {match.away_team}. ¡Haz tu pronóstico!"
            else:
                continue

            # Usuarios sin pronóstico
            predicted_users = db.query(models.Prediction.user_id).filter(
                models.Prediction.match_id == match.id
            ).subquery()

            users = db.query(models.User).filter(~models.User.id.in_(predicted_users)).all()

            for user in users:
                subs = db.query(models.PushSubscription).filter(
                    models.PushSubscription.user_id == user.id
                ).all()

                for sub in subs:
                    subscription = {
                        "endpoint": sub.endpoint,
                        "keys": {
                            "p256dh": sub.p256dh_key,
                            "auth": sub.auth_key,
                        },
                    }

                    send_push_message(
                        json.dumps(subscription),
                        f"⚽ {match.home_team} vs {match.away_team}",
                        body
                    )

    finally:
        db.close()

if __name__ == "__main__":
    db = SessionLocal()
    notify_upcoming_matches(db)