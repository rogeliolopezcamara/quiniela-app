from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status, APIRouter # type: ignore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials # type: ignore
from jose import JWTError, jwt # type: ignore
from passlib.context import CryptContext # type: ignore
from sqlalchemy.orm import Session # type: ignore
import os
from dotenv import load_dotenv # type: ignore

import models, schemas
from database import get_db

# Cargar variables de entorno
load_dotenv()

# Configuración
SECRET_KEY = os.getenv("SECRET_KEY", "mi_clave_por_defecto")
ALGORITHM = "HS256"
#ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Para manejar contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Autenticación con token tipo Bearer
oauth2_scheme = HTTPBearer()

# Función para generar hash de una contraseña
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Función para verificar una contraseña contra su hash
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Crear un JWT válido con tiempo de expiración
def create_access_token(data: dict):
    to_encode = data.copy()
    #expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    #to_encode.update({"exp": expire})
    print("DEBUG - Payload antes de codificar:", to_encode)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Buscar usuario por email
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

# Verificar credenciales de login
def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        return None
    return user

# Obtener el usuario actual autenticado usando el token JWT
# Función para obtener el usuario autenticado desde el token
def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    print("DEBUG - TOKEN RECIBIDO:", token.credentials)
    print("DEBUG - SECRET_KEY ACTUAL:", SECRET_KEY)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodificar el token
        payload = jwt.decode(token.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        print("DEBUG - PAYLOAD DECODIFICADO:", payload)

        sub = payload.get("sub")
        if sub is None:
            print("DEBUG - No se encontró 'sub' en el token.")
            raise credentials_exception

        try:
            user_id = int(sub)
        except (ValueError, TypeError):
            print("DEBUG - El valor de 'sub' no es convertible a int:", sub)
            raise credentials_exception

    except JWTError as e:
        print("DEBUG - Error al decodificar el token:", str(e))
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        print("DEBUG - Usuario no encontrado con ID:", user_id)
        raise credentials_exception

    print("DEBUG - Usuario autenticado:", user.name)
    return user

