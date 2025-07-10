# groups.py
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import models
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/groups")

class CreateGroupRequest(BaseModel):
    name: str

@router.post("/")
def create_group(
    request: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
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
    groups = (
        db.query(models.Group)
        .join(models.GroupMember, models.Group.id == models.GroupMember.group_id)
        .filter(models.GroupMember.user_id == current_user.id)
        .all()
    )

    result = []

    for group in groups:
        # Obtener todos los miembros del grupo con sus puntos
        members = (
            db.query(models.User.id, models.User.name, models.User.total_points)
            .join(models.GroupMember, models.User.id == models.GroupMember.user_id)
            .filter(models.GroupMember.group_id == group.id)
            .order_by(models.User.total_points.desc())
            .all()
        )

        # Calcular posición del usuario actual
        user_ranking = next(
            (i + 1 for i, m in enumerate(members) if m.id == current_user.id),
            None
        )

        result.append({
            "id": group.id,
            "name": group.name,
            "invite_code": group.invite_code,
            "member_count": len(members),
            "my_ranking": user_ranking
        })

    return result

@router.get("/{group_id}/ranking")
def group_ranking(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    members = (
        db.query(models.User.id.label("user_id"), models.User.name, models.User.total_points)
        .join(models.GroupMember, models.User.id == models.GroupMember.user_id)
        .filter(models.GroupMember.group_id == group_id)
        .order_by(models.User.total_points.desc())
        .all()
    )

    return {
        "group_name": group.name,
        "ranking": [{"user_id": m.user_id, "name": m.name, "points": m.total_points} for m in members]
    }