# groups.py
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func 
from pydantic import BaseModel
import models
from database import get_db
from auth import get_current_user
from sqlalchemy import text

router = APIRouter(prefix="/groups")

class CreateGroupRequest(BaseModel):
    name: str

@router.post("/")
def create_group(
    request: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    invite_code = str(uuid.uuid4())[:8]

    group = models.Group(
        name=request.name,
        code=invite_code,  # ✅ campo corregido
        creator_id=current_user.id  # ✅ se asigna el creador
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    membership = models.GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(membership)
    db.commit()

    return {
        "message": "✅ Grupo creado",
        "group": {
            "id": group.id,
            "name": group.name,
            "invite_code": group.code  # ✅ uso correcto del campo
        }
    }

class JoinGroupRequest(BaseModel):
    invite_code: str

@router.post("/join/")
def join_group(
    request: JoinGroupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    group = db.query(models.Group).filter(models.Group.code == request.invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Código inválido")

    already_member = db.query(models.GroupMember).filter_by(
        group_id=group.id, user_id=current_user.id
    ).first()
    if already_member:
        return {"message": "⚠️ Ya eres miembro de este grupo"}

    membership = models.GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(membership)
    db.commit()

    return {"message": "✅ Te uniste al grupo", "group_id": group.id}

@router.get("/")
def get_my_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    groups = (
        db.query(models.Group)
        .join(models.GroupMember, models.Group.id == models.GroupMember.group_id)
        .filter(models.GroupMember.user_id == current_user.id)
        .all()
    )

    return [
        {"id": g.id, "name": g.name, "invite_code": g.code}
        for g in groups
    ]

@router.get("/{group_id}/members")
def get_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    members = (
        db.query(models.User)
        .join(models.GroupMember, models.User.id == models.GroupMember.user_id)
        .filter(models.GroupMember.group_id == group_id)
        .all()
    )

    return [{"id": m.id, "name": m.name, "email": m.email} for m in members]

@router.get("/my-groups-with-stats")
def get_groups_with_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    groups = (
        db.query(models.Group)
        .join(models.GroupMember, models.Group.id == models.GroupMember.group_id)
        .filter(models.GroupMember.user_id == current_user.id)
        .all()
    )

    result = []

    for group in groups:
        members = (
            db.query(
                models.User.id.label("user_id"),
                models.User.name,
                func.coalesce(func.sum(models.Prediction.points), 0).label("total_points")
            )
            .join(models.GroupMember, models.User.id == models.GroupMember.user_id)
            .outerjoin(models.Prediction, models.User.id == models.Prediction.user_id)
            .filter(models.GroupMember.group_id == group.id)
            .group_by(models.User.id)
            .order_by(func.coalesce(func.sum(models.Prediction.points), 0).desc())
            .all()
        )

        user_ranking = next(
            (i + 1 for i, m in enumerate(members) if m.user_id == current_user.id),
            None
        )

        result.append({
            "id": group.id,
            "name": group.name,
            "invite_code": group.code,
            "member_count": len(members),
            "my_ranking": user_ranking,
            "is_creator": group.creator_id == current_user.id
        })

    return result


@router.get("/{group_id}/ranking")
def group_ranking(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    members = (
        db.query(
            models.User.id.label("user_id"),
            models.User.name,
            func.coalesce(func.sum(models.Prediction.points), 0).label("total_points")
        )
        .join(models.GroupMember, models.User.id == models.GroupMember.user_id)
        .outerjoin(models.Prediction, models.User.id == models.Prediction.user_id)
        .filter(models.GroupMember.group_id == group_id)
        .group_by(models.User.id)
        .order_by(func.coalesce(func.sum(models.Prediction.points), 0).desc())
        .all()
    )

    return {
        "group_name": group.name,
        "ranking": [
            {"user_id": m.user_id, "name": m.name, "points": m.total_points} for m in members
        ]
    }

@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db.execute(text("SELECT 1"))

    group = db.query(models.Group).filter(models.Group.id == group_id).first()

    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    if group.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar este grupo")

    db.delete(group)
    db.commit()

    return {"message": "🗑️ Grupo eliminado correctamente"}

