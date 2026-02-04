# Background Remover - Backend

FastAPI backend for image background removal using BiRefNet.

## Requirements

- Python 3.11+
- ~1GB disk space for BiRefNet model

## Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/remove-bg` | Single image upload |
| POST | `/api/v1/remove-bg/batch` | Batch upload (max 20) |
| GET | `/api/v1/status/{job_id}` | Job status |
| GET | `/api/v1/download/{job_id}/{image_id}` | Download result |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |

## Configuration

Environment variables (or `.env` file):

```env
DEBUG=false
MAX_FILE_SIZE=10485760
MAX_BATCH_SIZE=20
MAX_RESOLUTION=25000000
RETENTION_HOURS=24
CORS_ORIGINS=["http://localhost:3000"]
```

## Architecture

```
app/
├── main.py              # FastAPI app + lifespan
├── config.py            # Pydantic settings
├── api/v1/
│   ├── router.py        # API router
│   └── endpoints/       # Route handlers
├── models/
│   └── schemas.py       # Request/response models
├── services/
│   ├── image_processor.py  # BiRefNet processing
│   ├── job_manager.py      # In-memory job tracking
│   └── storage/            # File storage
└── utils/
    ├── cleanup.py       # Scheduled cleanup
    └── validators.py    # Input validation
```

## Model

Uses **BiRefNet-general** via rembg for high-quality background removal.

Model location: `~/.u2net/birefnet-general.onnx`
