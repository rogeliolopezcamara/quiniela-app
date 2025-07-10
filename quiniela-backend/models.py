from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Nueva relación con PushSubscription
    push_subscriptions = relationship("PushSubscription", back_populates="user", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True)
    home_team = Column(String)
    away_team = Column(String)
    match_date = Column(DateTime)
    score_home = Column(Integer, nullable=True)
    score_away = Column(Integer, nullable=True)
    league_id = Column(Integer, nullable=True)
    league_name = Column(String, nullable=True)
    league_logo = Column(String, nullable=True)
    league_season = Column(Integer, nullable=True)
    league_round = Column(String, nullable=True)
    home_team_logo = Column(String, nullable=True)
    away_team_logo = Column(String, nullable=True)


class Prediction(Base):
    __tablename__ = 'predictions'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    match_id = Column(Integer, ForeignKey("matches.id"))
    pred_home = Column(Integer, nullable=False)
    pred_away = Column(Integer, nullable=False)
    points = Column(Integer, default=0)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint = Column(Text, nullable=False)
    p256dh_key = Column(Text, nullable=False)
    auth_key = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=False), server_default=func.now())

    user = relationship("User", back_populates="push_subscriptions")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    used = Column(Boolean, default=False)

    user = relationship("User", backref="reset_tokens")