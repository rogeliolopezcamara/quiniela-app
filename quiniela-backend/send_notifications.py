# send_notifications.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal
import models
from push_notifications import send_push_message
import json

def notify_upcoming_matches():
    db: Session = SessionLocal()

    try:
        now = datetime.utcnow()

        lower_bound_24h = now + timedelta(hours=23)
        upper_bound_24h = now + timedelta(hours=24)

        lower_bound_1h = now + timedelta(minutes=30)
        upper_bound_1h = now + timedelta(hours=1)

        # Buscar partidos en los rangos deseados
        matches = db.query(models.Match).filter(
            models.Match.match_date.between(lower_bound_24h, upper_bound_24h) |
            models.Match.match_date.between(lower_bound_1h, upper_bound_1h)
        ).all()

        for match in matches:
            time_until_match = (match.match_date - now).total_seconds()

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

                    if lower_bound_24h <= match.match_date <= upper_bound_24h:
                        body = f"⏰ El partido empieza mañana: {match.home_team} vs {match.away_team}. ¡Haz tu pronóstico!"
                    elif lower_bound_1h <= match.match_date <= upper_bound_1h:
                        body = f"⚠️ Último aviso: {match.home_team} vs {match.away_team} comienza en menos de 1 hora."

                    else:
                        continue  # Seguridad extra

                    send_push_message(
                        json.dumps(subscription),
                        f"⚽ {match.home_team} vs {match.away_team}",
                        body
                    )

    finally:
        db.close()

if __name__ == "__main__":
    notify_upcoming_matches()