# send_notifications.py
from datetime import datetime, timedelta
from sqlalchemy.orm import Session # type: ignore
from sqlalchemy import Column, Integer, String, DateTime, select # type: ignore
from database import SessionLocal, Base
import models
from push_notifications import send_push_message
import json

class SentNotification(models.Base):
    __tablename__ = "sent_notifications"
    id = models.Column(models.Integer, primary_key=True, index=True)
    user_id = models.Column(models.Integer, index=True)
    match_id = models.Column(models.Integer, index=True)
    type = models.Column(models.String, index=True)  # "24h" o "1h"
    sent_at = models.Column(models.DateTime, default=datetime.utcnow)

def notify_upcoming_matches(db: Session):  # 👈 recibe db como argumento
    print("🚀 Iniciando ejecución de notify_upcoming_matches")
    try:
        now = datetime.utcnow()

        upper_bound_24h = now + timedelta(hours=24)

        # Buscar partidos en los rangos deseados, excluyendo los que ya empezaron
        matches = db.query(models.Match).filter(
            models.Match.match_date <= upper_bound_24h,
            models.Match.match_date > now
        ).all()

        for match in matches:
            time_until_match = (match.match_date - now).total_seconds()

            # Usuarios sin pronóstico
            predicted_users = db.query(models.Prediction.user_id).filter(
                models.Prediction.match_id == match.id
            ).subquery()

            # Subquery para competencias relacionadas con la liga del partido
            competencias_con_liga = db.query(models.CompetitionLeague.competition_id).filter(
                models.CompetitionLeague.league_id == match.league_id
            ).subquery()

            # Subquery para usuarios inscritos en esas competencias
            usuarios_en_competencias = db.query(models.CompetitionMember.user_id).filter(
                models.CompetitionMember.competition_id.in_(select(competencias_con_liga.c.competition_id))
            ).subquery()

            # Filtrar usuarios sin pronóstico y que están en una competencia con la liga del partido
            users = db.query(models.User).filter(
                ~models.User.id.in_(select(predicted_users.c.user_id)),
                models.User.id.in_(select(usuarios_en_competencias.c.user_id))
            ).all()

            notif_type = "1h" if time_until_match <= 3600 else "24h"

            print(f"🔔 Se enviarán {len(users)} notificaciones de tipo '{notif_type}' para el partido {match.home_team} vs {match.away_team}")

            for user in users:
                # Verifica si ya se envió esta notificación
                already_sent = db.query(SentNotification).filter_by(
                    user_id=user.id,
                    match_id=match.id,
                    type=notif_type
                ).first()

                if already_sent:
                    continue

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

                    if notif_type == "24h":
                        body = f"⏰ El partido empieza mañana: {match.home_team} vs {match.away_team}. ¡Haz tu pronóstico!"
                    elif notif_type == "1h":
                        body = f"⚠️ Último aviso: {match.home_team} vs {match.away_team} comienza en menos de 1 hora."
                    else:
                        continue

                    send_push_message(
                        json.dumps(subscription),
                        f"⚽ {match.home_team} vs {match.away_team}",
                        body
                    )

                    new_notif = SentNotification(
                        user_id=user.id,
                        match_id=match.id,
                        type=notif_type
                    )
                    db.add(new_notif)
                    db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    db = SessionLocal()
    notify_upcoming_matches(db)