# groups.py
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models
from database import get_db
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class CreateGroupRequest(BaseModel):
    name: str

@router.post("/groups/")
def create_group(
    request: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Generar código único de invitación
    invite_code = str(uuid.uuid4())[:8]

    group = models.Group(name=request.name, invite_code=invite_code)
    db.add(group)
    db.commit()
    db.refresh(group)

    # Agregar al creador como miembro
    membership = models.GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(membership)
    db.commit()

    return {"message": "✅ Grupo creado", "group": {"id": group.id, "name": group.name, "invite_code": group.invite_code}}

class JoinGroupRequest(BaseModel):
    invite_code: str

@router.post("/groups/join/")
def join_group(
    request: JoinGroupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    group = db.query(models.Group).filter(models.Group.invite_code == request.invite_code).first()
    if not group:
        raise HTTPException(status_code=404, detail="Código inválido")

    already_member = db.query(models.GroupMember).filter_by(group_id=group.id, user_id=current_user.id).first()
    if already_member:
        return {"message": "⚠️ Ya eres miembro de este grupo"}

    membership = models.GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(membership)
    db.commit()

    return {"message": "✅ Te uniste al grupo", "group_id": group.id}

@router.get("/groups/")
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

    return [{"id": g.id, "name": g.name, "invite_code": g.invite_code} for g in groups]

@router.get("/groups/{group_id}/members")
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