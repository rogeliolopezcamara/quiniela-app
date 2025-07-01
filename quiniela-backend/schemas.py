from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class PredictionCreate(BaseModel):
    match_id: int
    pred_home: int
    pred_away: int

class MatchResultUpdate(BaseModel):
    score_home: int
    score_away: int

class UserRanking(BaseModel):
    user_id: int
    name: str
    email: str
    total_points: int

class PredictionUpdate(BaseModel):
    pred_home: int
    pred_away: int

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str