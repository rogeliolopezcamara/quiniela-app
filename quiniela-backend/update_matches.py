import os
import requests
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import get_db
from models import Match

# Cargar claves y configuración
load_dotenv()
API_KEY = os.getenv("FOOTBALL_API_KEY")
BACKEND_URL = "https://quiniela-backend-2lc1.onrender.com"

HEADERS = {
    "x-apisports-key": API_KEY
}
BASE_URL = "https://v3.football.api-sports.io"

def get_fixtures(league_id=15, season=2023):
    url = f"{BASE_URL}/fixtures?league={league_id}&season={season}"
    response = requests.get(url, headers=HEADERS)
    data = response.json()

    if response.status_code != 200:
        print("Error al obtener fixtures:", data)
        return []

    return data.get("response", [])

def trigger_points_recalculation(match_id, score_home, score_away):
    url = f"{BACKEND_URL}/matches/{match_id}/result"
    payload = {
        "score_home": score_home,
        "score_away": score_away
    }
    try:
        response = requests.put(url, json=payload)
        if response.status_code == 200:
            print(f"[✔] Puntos recalculados para match {match_id}")
        else:
            print(f"[✘] Error recalculando puntos para match {match_id}: {response.status_code} {response.text}")
    except Exception as e:
        print(f"[✘] Fallo al conectar con el backend: {e}")

def upsert_matches_to_db(fixtures, db: Session):
    for match in fixtures:
        fixture = match["fixture"]
        teams = match["teams"]
        goals = match["goals"]

        match_id = fixture["id"]
        home_team = teams["home"]["name"]
        away_team = teams["away"]["name"]
        match_date = datetime.fromisoformat(fixture["date"].replace("Z", "+00:00"))
        score_home = goals["home"]
        score_away = goals["away"]

        existing_match = db.query(Match).filter_by(id=match_id).first()

        if existing_match:
            existing_match.home_team = home_team
            existing_match.away_team = away_team
            existing_match.match_date = match_date
            existing_match.score_home = score_home
            existing_match.score_away = score_away
        else:
            new_match = Match(
                id=match_id,
                home_team=home_team,
                away_team=away_team,
                match_date=match_date,
                score_home=score_home,
                score_away=score_away
            )
            db.add(new_match)

        # Si hay resultado, recalcular puntos
        if score_home is not None and score_away is not None:
            trigger_points_recalculation(match_id, score_home, score_away)

    db.commit()

if __name__ == "__main__":
    fixtures = get_fixtures()
    db = next(get_db())
    upsert_matches_to_db(fixtures, db)
    print("Actualización completa.")