import os
import requests
from datetime import datetime
from dotenv import load_dotenv # type: ignore
from sqlalchemy.orm import Session # type: ignore
from database import get_db
from models import Match
from sqlalchemy import text # type: ignore

# Cargar claves y configuración
load_dotenv()
API_KEY = os.getenv("FOOTBALL_API_KEY")
#BACKEND_URL = "https://quiniela-backend-2lc1.onrender.com"
BACKEND_URL = os.getenv("BACKEND_URL")

HEADERS = {
    "x-apisports-key": API_KEY
}
BASE_URL = "https://v3.football.api-sports.io"

def get_leagues_from_competitions(db: Session):
    # Obtener combinaciones únicas de liga y temporada desde la tabla competition_leagues
    result = db.execute(text("SELECT DISTINCT league_id, league_season FROM competition_leagues"))
    return result.fetchall()

def get_fixtures():
    db = next(get_db())
    league_entries = get_leagues_from_competitions(db)
    all_fixtures = []

    for entry in league_entries:
        league_id = entry[0]
        season = entry[1]
        print(f"Obteniendo partidos de liga {league_id} temporada {season}")
        url = f"{BASE_URL}/fixtures?league={league_id}&season={season}"
        response = requests.get(url, headers=HEADERS)
        data = response.json()

        if response.status_code != 200:
            print("Error al obtener fixtures:", data)
            continue

        all_fixtures.extend(data.get("response", []))

    return all_fixtures

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
        league = match["league"]
        teams = match["teams"]
        goals = match["goals"]

        match_id = fixture["id"]
        match_date = datetime.fromisoformat(fixture["date"].replace("Z", "+00:00"))
        score_home = goals["home"]
        score_away = goals["away"]

        # Nuevos campos
        league_id = league["id"]
        league_name = league["name"]
        league_logo = league["logo"]
        league_season = league["season"]
        league_round = league["round"]
        home_team = teams["home"]["name"]
        away_team = teams["away"]["name"]
        home_team_logo = teams["home"]["logo"]
        away_team_logo = teams["away"]["logo"]

        existing_match = db.query(Match).filter_by(id=match_id).first()

        if existing_match:
            existing_match.home_team = home_team
            existing_match.away_team = away_team
            existing_match.match_date = match_date
            existing_match.score_home = score_home
            existing_match.score_away = score_away
            existing_match.league_id = league_id
            existing_match.league_name = league_name
            existing_match.league_logo = league_logo
            existing_match.league_season = league_season
            existing_match.league_round = league_round
            existing_match.home_team_logo = home_team_logo
            existing_match.away_team_logo = away_team_logo
        else:
            new_match = Match(
                id=match_id,
                home_team=home_team,
                away_team=away_team,
                match_date=match_date,
                score_home=score_home,
                score_away=score_away,
                league_id=league_id,
                league_name=league_name,
                league_logo=league_logo,
                league_season=league_season,
                league_round=league_round,
                home_team_logo=home_team_logo,
                away_team_logo=away_team_logo
            )
            db.add(new_match)

        if score_home is not None and score_away is not None:
            trigger_points_recalculation(match_id, score_home, score_away)

    db.commit()

if __name__ == "__main__":
    fixtures = get_fixtures()
    db = next(get_db())
    upsert_matches_to_db(fixtures, db)
    print("Actualización completa.")