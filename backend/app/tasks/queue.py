"""Huey task queue backed by SQLite."""

from huey import SqliteHuey

from ..config import settings

_db_path = settings.upload_dir / "huey.db"
_db_path.parent.mkdir(parents=True, exist_ok=True)

huey = SqliteHuey(
    "clearcut",
    filename=str(_db_path),
    immediate=False,  # Set True in tests to run tasks synchronously
)

# Import worker module so tasks are registered when the consumer loads this module.
# This must come AFTER huey is defined to avoid circular imports.
import app.tasks.worker as _worker  # noqa: E402, F401
