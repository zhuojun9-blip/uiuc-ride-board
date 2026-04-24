from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pydantic_settings import BaseSettings
from urllib.parse import urlparse

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/uiuc_rideboard"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "http://localhost:5173"
    DEBUG: bool = True
    ADMIN_EMAILS: str = ""

    class Config:
        env_file = ".env"

settings = Settings()


def get_database_url() -> str:
    database_url = settings.DATABASE_URL.strip()
    parsed = urlparse(database_url)

    if parsed.scheme in {"http", "https"}:
        raise ValueError(
            "DATABASE_URL must be a PostgreSQL connection string, not a website URL. "
            "Use the Render PostgreSQL Internal Database URL."
        )

    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)

    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)

    return database_url

def is_admin_email(email: str) -> bool:
    configured_admins = {
        value.strip().lower()
        for value in settings.ADMIN_EMAILS.split(",")
        if value.strip()
    }
    return email.strip().lower() in configured_admins

engine = create_engine(get_database_url())
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
