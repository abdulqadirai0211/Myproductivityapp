"""Database configuration and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("mytracker.db")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mytracker.db")

# Build engine args based on DB type
engine_kwargs = {"echo": False}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables."""
    from models import Base as ModelsBase  # noqa: F401
    db_type = "PostgreSQL" if "postgresql" in DATABASE_URL else "SQLite"
    logger.info(f"  🗄️  Database: {db_type}")
    logger.info(f"  📍 URL: {DATABASE_URL[:50]}...")
    ModelsBase.metadata.create_all(bind=engine)
