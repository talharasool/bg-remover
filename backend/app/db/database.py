"""SQLite database connection and initialization."""

import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from pathlib import Path

from ..config import settings

_DB_PATH: Path | None = None


def get_db_path() -> Path:
    """Get the database file path."""
    global _DB_PATH
    if _DB_PATH is not None:
        return _DB_PATH
    return settings.upload_dir / "clearcut.db"


def set_db_path(path: Path) -> None:
    """Override the database path (used in tests)."""
    global _DB_PATH
    _DB_PATH = path


def reset_db_path() -> None:
    """Reset to default database path."""
    global _DB_PATH
    _DB_PATH = None


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Get a SQLite connection with WAL mode and foreign keys enabled."""
    db_path = get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
    finally:
        conn.close()


def init_db() -> None:
    """Create all tables if they don't exist."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id       TEXT PRIMARY KEY,
                status       TEXT NOT NULL DEFAULT 'pending',
                created_at   TEXT NOT NULL,
                updated_at   TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS job_images (
                image_id          TEXT PRIMARY KEY,
                job_id            TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                status            TEXT NOT NULL DEFAULT 'pending',
                download_url      TEXT,
                error             TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_job_images_job_id ON job_images(job_id);

            CREATE TABLE IF NOT EXISTS api_keys (
                key            TEXT PRIMARY KEY,
                user_email     TEXT NOT NULL,
                tier           TEXT NOT NULL DEFAULT 'free',
                requests_used  INTEGER NOT NULL DEFAULT 0,
                requests_limit INTEGER NOT NULL DEFAULT 50,
                created_at     TEXT NOT NULL,
                expires_at     TEXT,
                is_active      INTEGER NOT NULL DEFAULT 1,
                last_reset     TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_api_keys_email ON api_keys(user_email);
        """)
        conn.commit()
