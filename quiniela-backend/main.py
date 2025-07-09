from fastapi import FastAPI, Depends, HTTPException, Request, APIRouter
from sqlalchemy.orm import Session
from fastapi.responses import JSONResponse
from database import SessionLocal, engine, Base
import models, schemas, utils, auth
from fastapi.middleware.cors import CORSMiddleware
from auth import get_current_user
import os


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

from fastapi import status

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

    # Actualizar los resultados
    match.score_home = result.score_home
    match.score_away = result.score_away
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

from sqlalchemy import func

from sqlalchemy import func
from collections import defaultdict

@app.get("/ranking/")
def get_ranking(db: Session = Depends(get_db)):
    # 1. Obtener rondas activas (donde haya al menos un pronóstico)
    active_rounds = (
        db.query(models.Match.league_round)
        .join(models.Prediction, models.Prediction.match_id == models.Match.id)
        .filter(models.Match.league_round.isnot(None))
        .distinct()
        .order_by(models.Match.league_round)
        .all()
    )
    rounds = [r[0] for r in active_rounds]

    # 2. Obtener todos los usuarios
    users = db.query(models.User).all()

    # 3. Obtener puntos por usuario y por ronda (solo para rondas activas)
    round_points = (
        db.query(
            models.User.id.label("user_id"),
            models.Match.league_round,
            func.sum(models.Prediction.points).label("points")
        )
        .join(models.Prediction, models.User.id == models.Prediction.user_id)
        .join(models.Match, models.Prediction.match_id == models.Match.id)
        .filter(models.Match.league_round.in_(rounds))
        .group_by(models.User.id, models.Match.league_round)
        .all()
    )

    # 4. Mapear puntos por (user_id, round)
    points_by_user_round = {}
    for row in round_points:
        points_by_user_round[(row.user_id, row.league_round)] = row.points

    # 5. Construir estructura por usuario
    result = []
    for user in users:
        user_entry = {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "rounds": {},
            "total_points": 0
        }

        total = 0
        for rnd in rounds:
            pts = points_by_user_round.get((user.id, rnd), 0)
            user_entry["rounds"][rnd] = pts
            total += pts

        user_entry["total_points"] = total
        result.append(user_entry)

    # 6. Ordenar por total de puntos
    result.sort(key=lambda x: x["total_points"], reverse=True)

    return {
        "rounds": rounds,
        "ranking": result
    }


from datetime import datetime
from fastapi import Path

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

from sqlalchemy import and_

@app.get("/available-matches/")
def get_available_matches(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    subquery = (
        db.query(models.Prediction.match_id)
        .filter(models.Prediction.user_id == current_user.id)
    )

    matches = (
        db.query(models.Match)
        .filter(
            and_(
                models.Match.match_date > now,
                ~models.Match.id.in_(subquery)
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
            "away_team_logo": match.away_team_logo
        })

    return result

from fastapi.security import OAuth2PasswordRequestForm
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

@app.post("/update-matches")
def run_update_script(request: Request):
    secret = request.headers.get("X-Update-Token")
    if secret != os.getenv("UPDATE_SECRET"):
        raise HTTPException(status_code=403, detail="No autorizado")

    try:
        import update_matches
        import send_notifications  # 👈 importa tu nuevo script

        db = next(get_db())

        # Actualizar partidos
        fixtures = update_matches.get_fixtures()
        update_matches.upsert_matches_to_db(fixtures, db)

        # Enviar notificaciones después de actualizar
        send_notifications.notify_upcoming_matches()  # 👈 llama a tu función

        return {"message": "Actualización y notificaciones completadas"}
    except Exception as e:
        print("❌ Error durante la actualización o notificación:", e)
        raise HTTPException(status_code=500, detail="Error interno")

from push_notifications import router as push_router
app.include_router(push_router)