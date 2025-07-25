from fastapi import APIRouter, Depends, HTTPException # type: ignore
from sqlalchemy.orm import Session # type: ignore
from sqlalchemy import func # type: ignore
from database import get_db
from models import Competition, CompetitionLeague, CompetitionMember, User
import models
from typing import List, Optional
from pydantic import BaseModel # type: ignore
import random
import string
from auth import get_current_user

router = APIRouter()

# ----------- SCHEMAS -----------

class CompetitionLeagueCreate(BaseModel):
    league_id: int
    league_name: str
    league_logo: Optional[str]
    league_season: int

class CompetitionCreate(BaseModel):
    name: str
    is_public: bool
    leagues: List[CompetitionLeagueCreate]

class CompetitionOut(BaseModel):
    id: int
    name: str
    code: str
    is_public: bool
    created_at: str
    class Config:
        orm_mode = True

# ----------- UTILS -----------

def generate_unique_code(db: Session, length: int = 8):
    while True:
        code = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
        exists = db.query(Competition).filter(Competition.code == code).first()
        if not exists:
            return code

# ----------- ENDPOINTS -----------

@router.post("/competitions/", response_model=CompetitionOut)
def create_competition(data: CompetitionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    code = generate_unique_code(db)
    comp = Competition(
        name=data.name,
        code=code,
        is_public=data.is_public,
        creator_id=current_user.id,
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)

    for league in data.leagues:
        league_entry = CompetitionLeague(
            competition_id=comp.id,
            league_id=league.league_id,
            league_name=league.league_name,
            league_logo=league.league_logo,
            league_season=league.league_season
        )
        db.add(league_entry)

    # Add creator as first member
    member = CompetitionMember(user_id=current_user.id, competition_id=comp.id)
    db.add(member)

    db.commit()
    return comp

@router.post("/competitions/join/{code}")
def join_competition(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comp = db.query(Competition).filter(Competition.code == code).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")

    already_member = db.query(CompetitionMember).filter_by(
        user_id=current_user.id,
        competition_id=comp.id
    ).first()
    if already_member:
        raise HTTPException(status_code=400, detail="Already joined")

    member = CompetitionMember(user_id=current_user.id, competition_id=comp.id)
    db.add(member)
    db.commit()
    return {"message": "Joined successfully"}

@router.get("/competitions/my", response_model=List[CompetitionOut])
def get_my_competitions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comps = db.query(Competition).join(CompetitionMember).filter(
        CompetitionMember.user_id == current_user.id
    ).all()
    return comps


# ----------- NEW ENDPOINTS -----------

@router.get("/my-competitions-with-stats")
def get_my_competitions_with_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    competitions = (
        db.query(Competition)
        .join(CompetitionMember, Competition.id == CompetitionMember.competition_id)
        .filter(CompetitionMember.user_id == current_user.id)
        .all()
    )

    result = []

    for comp in competitions:
        members = (
            db.query(
                User.id.label("user_id"),
                User.name,
                func.coalesce(func.sum(models.Prediction.points), 0).label("total_points")
            )
            .join(CompetitionMember, User.id == CompetitionMember.user_id)
            .outerjoin(models.Prediction, User.id == models.Prediction.user_id)
            .outerjoin(models.Match, models.Prediction.match_id == models.Match.id)
            .join(models.CompetitionLeague, (models.Match.league_id == models.CompetitionLeague.league_id) &
                                          (models.Match.league_season == models.CompetitionLeague.league_season))
            .filter(CompetitionMember.competition_id == comp.id)
            .filter(models.CompetitionLeague.competition_id == comp.id)
            .group_by(User.id)
            .order_by(func.coalesce(func.sum(models.Prediction.points), 0).desc())
            .all()
        )

        user_ranking = next(
            (i + 1 for i, m in enumerate(members) if m.user_id == current_user.id),
            None
        )

        leagues = db.query(CompetitionLeague).filter(CompetitionLeague.competition_id == comp.id).all()

        member_count = db.query(CompetitionMember).filter(CompetitionMember.competition_id == comp.id).count()

        result.append({
            "id": comp.id,
            "name": comp.name,
            "is_public": comp.is_public,
            "invite_code": comp.code,
            "member_count": member_count,
            "my_ranking": user_ranking,
            "my_points": next((m.total_points for m in members if m.user_id == current_user.id), 0),
            "leagues": [{"league_name": l.league_name, "league_logo": l.league_logo} for l in leagues],
            "is_creator": comp.creator_id == current_user.id
        })

    return result


@router.delete("/competitions/{competition_id}")
def delete_competition(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comp = db.query(Competition).filter(Competition.id == competition_id).first()

    if not comp:
        raise HTTPException(status_code=404, detail="Competencia no encontrada")

    if comp.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar esta competencia")

    db.delete(comp)
    db.commit()

    return {"message": "🗑️ Competencia eliminada correctamente"}

@router.get("/competitions/leagues")
def get_all_competition_leagues(db: Session = Depends(get_db)):
    leagues = (
        db.query(
            CompetitionLeague.league_id,
            CompetitionLeague.league_name,
            CompetitionLeague.league_logo,
            CompetitionLeague.league_season
        )
        .distinct()
        .all()
    )

    return [
        {
            "league_id": l.league_id,
            "league_name": l.league_name,
            "league_logo": l.league_logo,
            "league_season": l.league_season
        }
        for l in leagues
    ]
@router.get("/competitions/public")
def get_public_competitions(db: Session = Depends(get_db)):
    competitions = db.query(Competition).filter(Competition.is_public == True).all()
    result = []

    for comp in competitions:
        leagues = db.query(CompetitionLeague).filter(CompetitionLeague.competition_id == comp.id).all()
        result.append({
            "id": comp.id,
            "name": comp.name,
            "code": comp.code,
            "is_public": comp.is_public,
            "created_at": comp.created_at,
            "leagues": [
                {
                    "league_name": l.league_name,
                    "league_logo": l.league_logo,
                    "league_season": l.league_season
                }
                for l in leagues
            ]
        })
    return result