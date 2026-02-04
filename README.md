# Background Remover

A full-stack web application for automatic image background removal using AI (BiRefNet via rembg).

## Features

- Automatic background removal using **BiRefNet** AI model (high-quality results)
- Drag & drop image upload
- Batch processing (up to 20 images)
- Real-time processing status with progress indicators
- Before/after preview with transparency display
- Bulk download as ZIP
- Auto-cleanup (24-hour file retention)
- RESTful API with Swagger documentation

## Tech Stack

| Layer | Technology |
|-------|------------|
| ML Model | BiRefNet (via rembg) |
| Backend | FastAPI + Python 3.11+ |
| Frontend | Next.js 14 + React 18 |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Deployment | Docker + docker-compose |

## Quick Start

### Option 1: Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd bg-remover

# Start the application
docker-compose up --build

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: Manual Setup (Development)

#### Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn

#### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The first run will download the BiRefNet model (~973MB). This is a one-time download.

#### Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

#### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/remove-bg` | Upload single image for processing |
| POST | `/api/v1/remove-bg/batch` | Upload multiple images (max 20) |
| GET | `/api/v1/status/{job_id}` | Check processing status |
| GET | `/api/v1/download/{job_id}/{image_id}` | Download processed image |
| GET | `/health` | Health check |
| GET | `/stats` | Storage statistics |

### Example API Usage

```bash
# Upload single image
curl -X POST -F "file=@image.jpg" http://localhost:8000/api/v1/remove-bg

# Response:
# {"job_id":"abc-123","message":"Image uploaded successfully. Processing started.","total_images":1}

# Check job status
curl http://localhost:8000/api/v1/status/abc-123

# Download processed image (when status is "completed")
curl -o output.png http://localhost:8000/api/v1/download/abc-123/image-id
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Backend Configuration
DEBUG=false
MAX_FILE_SIZE=10485760        # 10MB in bytes
MAX_BATCH_SIZE=20             # Maximum images per batch
MAX_RESOLUTION=25000000       # 25 megapixels
RETENTION_HOURS=24            # Auto-cleanup after 24 hours
CORS_ORIGINS=["http://localhost:3000"]

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Limits

| Setting | Value |
|---------|-------|
| Max file size | 10MB |
| Max batch size | 20 files |
| Max resolution | 25 megapixels |
| Processing timeout | 60 seconds/image |
| File retention | 24 hours |

### Supported Formats

- **Input**: JPG, JPEG, PNG, WEBP
- **Output**: PNG with transparent background

## Project Structure

```
bg-remover/
├── docker-compose.yml          # Docker orchestration
├── README.md                   # This file
├── .env.example                # Environment template
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── README.md               # Backend documentation
│   └── app/
│       ├── main.py             # FastAPI entry point
│       ├── config.py           # Settings configuration
│       ├── api/v1/
│       │   ├── router.py
│       │   └── endpoints/
│       │       ├── images.py   # Upload endpoints
│       │       ├── jobs.py     # Status endpoint
│       │       └── downloads.py # Download endpoint
│       ├── models/
│       │   └── schemas.py      # Pydantic models
│       ├── services/
│       │   ├── image_processor.py  # BiRefNet integration
│       │   ├── job_manager.py      # Job tracking
│       │   └── storage/
│       │       ├── base.py     # Storage interface
│       │       └── local.py    # Local filesystem
│       └── utils/
│           ├── cleanup.py      # Auto-cleanup
│           └── validators.py   # Image validation
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── README.md               # Frontend documentation
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/             # Button, Card, Progress, Spinner
│       │   ├── upload/         # DropZone, FileList
│       │   ├── preview/        # ImagePreview, ImageGrid
│       │   └── download/       # DownloadButton, BulkDownload
│       ├── hooks/
│       │   ├── useImageUpload.ts
│       │   └── useJobStatus.ts
│       ├── lib/
│       │   └── api.ts          # API client
│       └── store/
│           └── imageStore.ts   # Zustand store
│
└── scripts/
    └── download-models.sh      # Pre-download model script
```

## Production Deployment

```bash
# Build and run in detached mode
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Troubleshooting

### Model Download Issues

The BiRefNet model (~973MB) is downloaded on first run. If download fails:

```bash
# Manually trigger model download
cd backend
source venv/bin/activate
python -c "from rembg import new_session; new_session('birefnet-general')"
```

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Permission Issues (Docker)

```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER ./uploads
```

## License

MIT

## Acknowledgments

- [rembg](https://github.com/danielgatis/rembg) - Background removal library
- [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) - Bilateral Reference Network for high-resolution image segmentation
