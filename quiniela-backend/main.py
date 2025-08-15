from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter # type: ignore
from sqlalchemy.orm import Session # type: ignore
from fastapi.responses import JSONResponse # type: ignore
from database import SessionLocal, engine, Base
import models, schemas, utils, auth
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from auth import get_current_user
import os
from sqlalchemy import text # type: ignore
import time
from sqlalchemy.exc import OperationalError # type: ignore


app = FastAPI()

@app.get("/")
def root():
    return {"message": "Bienvenido a la API de la quiniela"}

FRONT_END_URL = os.getenv("FRONTEND_URL")
# Configura los orígenes permitidos (tu frontend)
origins = [
    "http://localhost:5173",
    FRONT_END_URL  # <--- importante
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # también puedes usar ["*"] temporalmente para pruebas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

# Dependency: cada vez que se hace un request, se abre una sesión de BD
def get_db():
    db = SessionLocal()
    from sqlalchemy import text # type: ignore
    from sqlalchemy.exc import PendingRollbackError # type: ignore

    try:
        db.execute(text("SELECT 1"))
    except PendingRollbackError:
        print("[DB] Rollback pendiente detectado")
        db.rollback()
    try:
        yield db
    finally:
        db.close()

@app.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verifica si ya existe el correo
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    hashed_pw = utils.hash_password(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"id": new_user.id, "name": new_user.name, "email": new_user.email}

from fastapi import status # type: ignore

@app.post("/predictions/")
def create_prediction(
    pred: schemas.PredictionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    match = db.query(models.Match).filter(models.Match.id == pred.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    existing = db.query(models.Prediction).filter_by(
        user_id=current_user.id,
        match_id=pred.match_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya hiciste un pronóstico para este partido")

    new_prediction = models.Prediction(
        user_id=current_user.id,
        match_id=pred.match_id,
        pred_home=pred.pred_home,
        pred_away=pred.pred_away,
        points=0
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    return {
        "prediction_id": new_prediction.id,
        "match_id": new_prediction.match_id,
        "pred_home": new_prediction.pred_home,
        "pred_away": new_prediction.pred_away,
        "points": new_prediction.points
    }

@app.put("/matches/{match_id}/result")
def update_match_result(
    match_id: int,
    result: schemas.MatchResultUpdate,
    db: Session = Depends(get_db)
):
    # Buscar el partido
    match = db.query(models.Match).filter(models.Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    # Actualizar los resultados y los nuevos campos de status
    match.score_home = result.score_home
    match.score_away = result.score_away
    match.status_long = result.status_long
    match.status_short = result.status_short
    match.status_elapsed = result.status_elapsed
    match.status_extra = result.status_extra
    db.commit()

    # Obtener todos los pronósticos de ese partido
    predictions = db.query(models.Prediction).filter_by(match_id=match_id).all()

    # Regla para calcular puntos:
    # - 3 puntos si acierta marcador exacto
    # - 1 punto si acierta al ganador
    # - 0 en otro caso
    for pred in predictions:
        points = 0
        if pred.pred_home == match.score_home and pred.pred_away == match.score_away:
            points = 3
        elif (
            (pred.pred_home > pred.pred_away and match.score_home > match.score_away) or
            (pred.pred_home < pred.pred_away and match.score_home < match.score_away) or
            (pred.pred_home == pred.pred_away and match.score_home == match.score_away)
        ):
            points = 1
        pred.points = points

    db.commit()

    return {"message": f"Resultado actualizado y puntos recalculados para {len(predictions)} pronósticos"}

from sqlalchemy import func # type: ignore

from sqlalchemy import func # type: ignore
from collections import defaultdict

from sqlalchemy import tuple_ # type: ignore

@app.get("/ranking/")
def get_ranking(
    competition_id: int,
    db: Session = Depends(get_db)
):
    # Obtener las ligas asociadas a la competencia
    competition = db.query(models.Competition).filter(models.Competition.id == competition_id).first()
    if not competition:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    league_filters = db.query(models.CompetitionLeague.league_id, models.CompetitionLeague.league_season).filter(
        models.CompetitionLeague.competition_id == competition_id
    ).all()

    if not league_filters:
        return {"rounds": [], "ranking": []}

    # 1. Obtener rondas activas en esas ligas
    active_rounds = (
        db.query(models.Match.league_round)
        .join(models.Prediction, models.Prediction.match_id == models.Match.id)
        .filter(
            tuple_(
                models.Match.league_id,
                models.Match.league_season
            ).in_(league_filters)
        )
        .distinct()
        .order_by(models.Match.league_round)
        .all()
    )
    rounds = [r[0] for r in active_rounds]

    # 2. Obtener usuarios inscritos en esta competencia
    user_ids = db.query(models.CompetitionMember.user_id).filter(
        models.CompetitionMember.competition_id == competition_id
    ).all()
    user_ids = [u[0] for u in user_ids]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()

    # 3. Obtener puntos por usuario y ronda
    round_points = (
        db.query(
            models.User.id.label("user_id"),
            models.Match.league_round,
            func.sum(models.Prediction.points).label("points")
        )
        .join(models.Prediction, models.User.id == models.Prediction.user_id)
        .join(models.Match, models.Prediction.match_id == models.Match.id)
        .filter(
            models.User.id.in_(user_ids),
            tuple_(models.Match.league_id, models.Match.league_season).in_(league_filters),
            models.Match.league_round.in_(rounds)
        )
        .group_by(models.User.id, models.Match.league_round)
        .all()
    )

    points_by_user_round = {(rp.user_id, rp.league_round): rp.points for rp in round_points}

    result = []
    for user in users:
        entry = {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "rounds": {},
            "total_points": 0
        }
        total = 0
        for rnd in rounds:
            pts = points_by_user_round.get((user.id, rnd), 0)
            entry["rounds"][rnd] = pts
            total += pts
        entry["total_points"] = total
        result.append(entry)

    result.sort(key=lambda x: x["total_points"], reverse=True)
    for idx, entry in enumerate(result, start=1):
        entry["position"] = idx

    return {
        "rounds": rounds,
        "ranking": result
    }


from datetime import datetime
from fastapi import Path # type: ignore

@app.put("/predictions/{prediction_id}")
def update_prediction(
    prediction_id: int,
    update: schemas.PredictionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    prediction = db.query(models.Prediction).filter(models.Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Pronóstico no encontrado")

    if prediction.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="No puedes editar este pronóstico")

    match = db.query(models.Match).filter(models.Match.id == prediction.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    if match.match_date <= datetime.utcnow():
        raise HTTPException(status_code=400, detail="El partido ya comenzó")

    prediction.pred_home = update.pred_home
    prediction.pred_away = update.pred_away
    prediction.points = 0
    db.commit()
    db.refresh(prediction)

    return {
        "message": "Pronóstico actualizado",
        "prediction": {
            "id": prediction.id,
            "match_id": prediction.match_id,
            "pred_home": prediction.pred_home,
            "pred_away": prediction.pred_away
        }
    }

from sqlalchemy import and_ # type: ignore

@app.get("/available-matches/")
def get_available_matches(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    # Obtener ligas de las competencias donde el usuario está inscrito
    league_filters = db.query(
        models.CompetitionLeague.league_id,
        models.CompetitionLeague.league_season
    ).join(models.Competition, models.Competition.id == models.CompetitionLeague.competition_id
    ).join(models.CompetitionMember, models.CompetitionMember.competition_id == models.Competition.id
    ).filter(models.CompetitionMember.user_id == current_user.id).all()

    if not league_filters:
        return []

    subquery = db.query(models.Prediction.match_id).filter(models.Prediction.user_id == current_user.id)

    matches = (
        db.query(models.Match)
        .filter(
            and_(
                models.Match.match_date > now,
                ~models.Match.id.in_(subquery),
                tuple_(models.Match.league_id, models.Match.league_season).in_(league_filters)
            )
        )
        .order_by(models.Match.match_date.asc())
        .all()
    )

    return [
        {
            "match_id": match.id,
            "home_team": match.home_team,
            "away_team": match.away_team,
            "match_date": match.match_date,
            "score_home": match.score_home,
            "score_away": match.score_away,
            "league_id": match.league_id,
            "league_name": match.league_name,
            "league_logo": match.league_logo,
            "league_season": match.league_season,
            "league_round": match.league_round,
            "home_team_logo": match.home_team_logo,
            "away_team_logo": match.away_team_logo
        }
        for match in matches
    ]

# Nuevo endpoint: /available-matches/{competition_id}
@app.get("/available-matches/{competition_id}")
def get_available_matches_by_competition(
    competition_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    # Verificar que el usuario esté inscrito en la competencia
    member = db.query(models.CompetitionMember).filter_by(
        user_id=current_user.id,
        competition_id=competition_id
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="No estás inscrito en esta competencia")

    # Obtener ligas de la competencia
    league_filters = db.query(
        models.CompetitionLeague.league_id,
        models.CompetitionLeague.league_season
    ).filter(models.CompetitionLeague.competition_id == competition_id).all()

    if not league_filters:
        return []

    subquery = db.query(models.Prediction.match_id).filter(models.Prediction.user_id == current_user.id)

    matches = (
        db.query(models.Match)
        .filter(
            and_(
                models.Match.match_date > now,
                ~models.Match.id.in_(subquery),
                tuple_(models.Match.league_id, models.Match.league_season).in_(league_filters)
            )
        )
        .order_by(models.Match.match_date.asc())
        .all()
    )

    return [
        {
            "match_id": match.id,
            "home_team": match.home_team,
            "away_team": match.away_team,
            "match_date": match.match_date,
            "score_home": match.score_home,
            "score_away": match.score_away,
            "league_id": match.league_id,
            "league_name": match.league_name,
            "league_logo": match.league_logo,
            "league_season": match.league_season,
            "league_round": match.league_round,
            "home_team_logo": match.home_team_logo,
            "away_team_logo": match.away_team_logo
        }
        for match in matches
    ]

@app.get("/my-predictions/")
def get_user_predictions(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    predictions = (
        db.query(models.Prediction, models.Match)
        .join(models.Match, models.Prediction.match_id == models.Match.id)
        .filter(models.Prediction.user_id == current_user.id)
        .order_by(models.Match.match_date)
        .all()
    )

    result = []
    for prediction, match in predictions:
        result.append({
            "prediction_id": prediction.id,
            "match_id": match.id,
            "home_team": match.home_team,
            "away_team": match.away_team,
            "match_date": match.match_date,
            "pred_home": prediction.pred_home,
            "pred_away": prediction.pred_away,
            "score_home": match.score_home,
            "score_away": match.score_away,
            "points": prediction.points,
            "league_id": match.league_id,
            "league_name": match.league_name,
            "league_logo": match.league_logo,
            "league_season": match.league_season,
            "league_round": match.league_round,
            "home_team_logo": match.home_team_logo,
            "away_team_logo": match.away_team_logo,
            "status_long": match.status_long,
            "status_short": match.status_short,
            "status_elapsed": match.status_elapsed,
            "status_extra": match.status_extra
        })

    return result

# Nuevo endpoint: /my-predictions/{competition_id}
@app.get("/my-predictions/{competition_id}")
def get_user_predictions_by_competition(
    competition_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verificar que el usuario esté inscrito en la competencia
    member = db.query(models.CompetitionMember).filter_by(
        user_id=current_user.id,
        competition_id=competition_id
    ).first()

    if not member:
        raise HTTPException(status_code=403, detail="No estás inscrito en esta competencia")

    # Obtener ligas asociadas a la competencia
    league_filters = db.query(
        models.CompetitionLeague.league_id,
        models.CompetitionLeague.league_season
    ).filter(models.CompetitionLeague.competition_id == competition_id).all()

    if not league_filters:
        return []

    predictions = (
        db.query(models.Prediction, models.Match)
        .join(models.Match, models.Prediction.match_id == models.Match.id)
        .filter(
            models.Prediction.user_id == current_user.id,
            tuple_(models.Match.league_id, models.Match.league_season).in_(league_filters)
        )
        .order_by(models.Match.match_date)
        .all()
    )

    result = []
    for prediction, match in predictions:
        result.append({
            "prediction_id": prediction.id,
            "match_id": match.id,
            "home_team": match.home_team,
            "away_team": match.away_team,
            "match_date": match.match_date,
            "pred_home": prediction.pred_home,
            "pred_away": prediction.pred_away,
            "score_home": match.score_home,
            "score_away": match.score_away,
            "points": prediction.points,
            "league_id": match.league_id,
            "league_name": match.league_name,
            "league_logo": match.league_logo,
            "league_season": match.league_season,
            "league_round": match.league_round,
            "home_team_logo": match.home_team_logo,
            "away_team_logo": match.away_team_logo,
            "status_long": match.status_long,
            "status_short": match.status_short,
            "status_elapsed": match.status_elapsed,
            "status_extra": match.status_extra
        })

    return result

from fastapi.security import OAuth2PasswordRequestForm # type: ignore
import auth

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(auth.get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")

    access_token = auth.create_access_token(data={"sub": str(user.id)})
    print("DEBUG - Generando token para user_id:", user.id)
    return {"access_token": access_token, "token_type": "bearer","user_id": user.id}

@app.get("/me")
def get_my_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    total_points = (
        db.query(func.coalesce(func.sum(models.Prediction.points), 0))
        .filter(models.Prediction.user_id == current_user.id)
        .scalar()
    )

    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at,
        "total_points": total_points
    }


from fastapi import BackgroundTasks # type: ignore

# Nuevo endpoint para enviar notificaciones cada hora
@app.post("/notify-upcoming-matches")
async def notify_upcoming(
    request: Request,
    background_tasks: BackgroundTasks
):
    secret = request.headers.get("X-Update-Token")
    if secret != os.getenv("UPDATE_SECRET"):
        raise HTTPException(status_code=403, detail="No autorizado")

    from send_notifications import notify_upcoming_matches
    from database import SessionLocal

    def run_notification():
        db_session = SessionLocal()
        try:
            notify_upcoming_matches(db_session)
        except Exception as e:
            print("❌ Error en notificación:", e)
        finally:
            db_session.close()

    background_tasks.add_task(run_notification)
    return {"message": "🔔 Notificación iniciada en segundo plano"}



# Nuevo endpoint: actualización completa de partidos
@app.post("/update-all-matches")
async def update_all_matches(
    request: Request,
    background_tasks: BackgroundTasks
):
    secret = request.headers.get("X-Update-Token")
    if secret != os.getenv("UPDATE_SECRET"):
        raise HTTPException(status_code=403, detail="No autorizado")

    from update_matches import get_fixtures, upsert_matches_to_db
    from database import SessionLocal

    def run_full_update():
        db_session = SessionLocal()
        try:
            fixtures = get_fixtures()
            upsert_matches_to_db(fixtures, db_session)
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            print("❌ Error en actualización completa:", e)
        finally:
            db_session.close()

    background_tasks.add_task(run_full_update)
    return {"message": "📅 Actualización completa iniciada en segundo plano"}

# Nuevo endpoint: actualización de partidos en vivo
@app.post("/update-live-matches")
async def update_live_matches(
    request: Request,
    background_tasks: BackgroundTasks
):
    secret = request.headers.get("X-Update-Token")
    if secret != os.getenv("UPDATE_SECRET"):
        raise HTTPException(status_code=403, detail="No autorizado")

    from update_matches import update_live_matches_from_api
    from database import SessionLocal

    def run_live_update():
        db_session = SessionLocal()
        try:
            update_live_matches_from_api(db_session)
        except Exception as e:
            db_session.rollback()
            print("❌ Error en actualización de partidos en vivo:", e)
        finally:
            db_session.close()

    background_tasks.add_task(run_live_update)
    return {"message": "⏱️ Actualización de partidos en vivo iniciada en segundo plano"}


# Nuevo endpoint: matriz de enfrentamientos por ronda
@app.get("/round-matrix/")
def get_round_matrix(
    competition_id: int,
    league_round: str,
    db: Session = Depends(get_db)
):
    # Obtener ligas y temporadas asociadas a la competencia
    league_filters = db.query(
        models.CompetitionLeague.league_id,
        models.CompetitionLeague.league_season
    ).filter(models.CompetitionLeague.competition_id == competition_id).all()
    if not league_filters:
        return {"rounds": [], "users": [], "matrix": [], "matches": [], "predictions": []}

    # Solo considerar la ronda específica proporcionada
    rounds = [league_round]

    # Obtener usuarios inscritos
    user_ids = db.query(models.CompetitionMember.user_id).filter(
        models.CompetitionMember.competition_id == competition_id
    ).all()
    user_ids = [u[0] for u in user_ids]
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()

    # Obtener puntos por usuario SOLO para la ronda específica
    round_points = (
        db.query(
            models.User.id.label("user_id"),
            models.Match.league_round,
            func.sum(models.Prediction.points).label("points")
        )
        .join(models.Prediction, models.User.id == models.Prediction.user_id)
        .join(models.Match, models.Prediction.match_id == models.Match.id)
        .filter(
            models.User.id.in_(user_ids),
            tuple_(models.Match.league_id, models.Match.league_season).in_(league_filters),
            models.Match.league_round == league_round
        )
        .group_by(models.User.id, models.Match.league_round)
        .all()
    )
    points_by_user_round = {(rp.user_id, rp.league_round): rp.points for rp in round_points}

    matrix = []
    for user in users:
        row = {
            "user_id": user.id,
            "name": user.name,
            # "email": user.email,  # Eliminado según instrucciones
            "points": []
        }
        for rnd in rounds:
            pts = points_by_user_round.get((user.id, rnd), 0)
            row["points"].append(pts)
        matrix.append(row)

    # Obtener partidos de la ronda y ligas filtradas
    matches = (
        db.query(models.Match)
        .filter(
            models.Match.league_round == league_round,
            tuple_(models.Match.league_id, models.Match.league_season).in_(league_filters)
        )
        .all()
    )
    matches_result = []
    for match in matches:
        matches_result.append({
            "id": match.id,
            "home_team": match.home_team,
            "away_team": match.away_team,
            "home_team_logo": match.home_team_logo,
            "away_team_logo": match.away_team_logo,
            "score_home": match.score_home,
            "score_away": match.score_away,
            "status_short": match.status_short,
            "match_date": match.match_date,
            "status_long": match.status_long,
            "status_short": match.status_short,
            "status_elapsed": match.status_elapsed,
            "status_extra": match.status_extra
        })

    # IDs de partidos de la ronda
    match_ids = [m.id for m in matches]

    # Obtener predicciones por usuario-partido para esta ronda
    predictions = []
    if match_ids and user_ids:
        preds = (
            db.query(models.Prediction)
            .filter(
                models.Prediction.match_id.in_(match_ids),
                models.Prediction.user_id.in_(user_ids)
            )
            .all()
        )
        predictions = [
            {
                "user_id": p.user_id,
                "match_id": p.match_id,
                "points": p.points,
            }
            for p in preds
        ]

    return {
        "rounds": rounds,
        "users": [{"user_id": u.id, "name": u.name} for u in users],  # email eliminado
        "matrix": matrix,
        "matches": matches_result,
        "predictions": predictions,
    }


@app.post("/update-matches")
async def run_update_script(
    request: Request,
    background_tasks: BackgroundTasks
):
    secret = request.headers.get("X-Update-Token")
    if secret != os.getenv("UPDATE_SECRET"):
        raise HTTPException(status_code=403, detail="No autorizado")

    from update_matches import get_fixtures, upsert_matches_to_db
    from send_notifications import notify_upcoming_matches
    from database import SessionLocal

    def run_update():
        db_session = SessionLocal()
        try:
            fixtures = get_fixtures()
            upsert_matches_to_db(fixtures, db_session)
            db_session.commit()
            notify_upcoming_matches(db_session)
        except Exception as e:
            db_session.rollback()
            print("❌ Error en background:", e)
        finally:
            db_session.close()

    background_tasks.add_task(run_update)

    return {"message": "⏳ Actualización iniciada en segundo plano"}

from push_notifications import router as push_router
app.include_router(push_router)

from password_reset import router as password_reset_router
app.include_router(password_reset_router)

from groups import router as groups_router
app.include_router(groups_router)

from competitions import router as competitions_router
app.include_router(competitions_router)