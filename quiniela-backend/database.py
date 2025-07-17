from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

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
    from sqlalchemy import text  # type: ignore
    import time
    from sqlalchemy.exc import OperationalError, PendingRollbackError  # type: ignore

    MAX_RETRIES = 5
    WAIT_SECONDS = 3

    for attempt in range(MAX_RETRIES):
        try:
            db.execute(text("SELECT 1"))
            break
        except PendingRollbackError:
            print("[DB] Detectado rollback pendiente, intentando limpiar...")
            db.rollback()
        except OperationalError as e:
            print(f"[DB] Intento {attempt + 1} falló: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(WAIT_SECONDS)
            else:
                print("❌ No se pudo conectar a la base de datos después de varios intentos.")
                raise
    try:
        yield db
    finally:
        db.close()