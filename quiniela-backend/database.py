from sqlalchemy import create_engine # type: ignore
from sqlalchemy.orm import sessionmaker, declarative_base # type: ignore
import os
from dotenv import load_dotenv # type: ignore

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    connect_args={"sslmode": "require"},  # obligatorio para Neon
    pool_pre_ping=True
)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()

# Función para obtener una sesión de base de datos
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