# ClearCut

A full-stack AI-powered image processing platform. Background removal, compression, retouching, watermark removal — with a paid API and subscription management.

## Current Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Engineering Foundation (tests, CI/CD, linting) | Done |
| 1 | Infrastructure for Scale (task queue, persistence, rate limiting, API keys, custom backgrounds) | Done |
| 2 | Bulk Upload Frontend | Planned |
| 3 | Compression & Format Conversion (images + PDFs) | Planned |
| 4 | Image Retouching | Planned |
| 5 | Watermark Removal (LaMa) | Planned |
| 6 | Deployment (Oracle Cloud + Vercel + R2) | Planned |

## Architecture

```
Vercel (free)                    Cloudflare R2 (free, 10GB)
  └── Next.js frontend             └── Processed images (0 egress cost)
        │
        ▼
Oracle Cloud ARM VM (free forever — 4 OCPU, 24GB RAM)
  ├── Nginx (reverse proxy + SSL)
  ├── FastAPI (API server)
  ├── SQLite (job state + API keys + usage tracking)
  ├── Huey + SQLite (task queue)
  ├── BiRefNet worker (bg removal)
  ├── LaMa worker (watermark removal)
  ├── Pillow + oxipng + mozjpeg (image compression)
  ├── pikepdf + Ghostscript (PDF compression)
  └── API key auth + tier-based rate limiting
```

**Total monthly cost: $0**

## Tech Stack

| Layer | Technology |
|-------|------------|
| ML Models | BiRefNet (bg removal), LaMa (watermark removal) |
| Backend | FastAPI + Python 3.11+ |
| Task Queue | Huey + SQLite |
| Database | SQLite |
| Frontend | Next.js 14 + React 18 + Zustand |
| Styling | Tailwind CSS v4 |
| Object Storage | Cloudflare R2 (S3-compatible) |
| Payments | Stripe Checkout + Webhooks |
| CI/CD | GitHub Actions |
| Hosting | Oracle Cloud ARM (backend) + Vercel (frontend) |

## Features

### Available Now (Phase 0 + 1)
- Automatic background removal using **BiRefNet** AI model
- Drag & drop single image upload
- Batch processing (up to 20 images)
- Real-time processing status with progress indicators
- Before/after preview with transparency display
- **Custom background colors** — 10 presets + native color picker + hex input
- **Social media frames** — Instagram Post/Story, Facebook Post/Cover, Twitter/X, LinkedIn + custom dimensions
- Canvas-based composite rendering with instant preview
- Persistent task queue (Huey + SQLite)
- Persistent job storage (SQLite, survives restarts)
- Rate limiting (slowapi, tier-based)
- Cloudflare R2 storage backend
- API key generation & management (Free / Pro / Enterprise tiers)
- Stripe Checkout for paid tiers
- Usage tracking & quota enforcement
- Auto-cleanup (24-hour file retention)
- RESTful API with Swagger docs
- Docker Compose orchestration
- CI/CD with GitHub Actions
- Full test suite (backend: pytest 80%+ coverage; frontend: TypeScript + ESLint)

### Roadmap

**Phase 2 — Bulk Upload**
- Multi-file dropzone with thumbnails
- Per-file progress bars & status indicators
- Gallery view of processed images
- "Download All" as ZIP

**Phase 3 — Compression & Format Conversion**
- Image compression (JPEG, PNG, WebP, AVIF) with quality slider
- PDF compression (lossless via pikepdf, lossy via Ghostscript)
- General file archiving (ZIP/GZIP)
- Before/after size comparison

**Phase 4 — Image Retouching**
- Brightness, contrast, saturation, sharpening
- Crop & rotate
- Background replacement
- Live client-side preview with CSS filters

**Phase 5 — Watermark Removal**
- User draws mask over watermark area
- LaMa inpainting model removes watermark
- Canvas-based brush tool

**Phase 6 — Deployment**
- Oracle Cloud ARM VM (free tier)
- Nginx reverse proxy + Let's Encrypt SSL
- Vercel frontend (auto-deploy from main)
- Cloudflare R2 bucket
- CD pipeline: test → build → deploy on merge to main

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/talharasool/bg-remover.git
cd bg-remover
docker-compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup (Development)

#### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt  # tests, linting, type checking

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The first run downloads the BiRefNet model (~973MB). One-time only.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/remove-bg` | Upload single image for bg removal |
| POST | `/api/v1/remove-bg/batch` | Upload multiple images (max 20) |
| GET | `/api/v1/status/{job_id}` | Check processing status |
| GET | `/api/v1/download/{job_id}/{image_id}` | Download processed image |
| GET | `/health` | Health check |
| GET | `/stats` | Storage statistics |

### Example

```bash
# Upload
curl -X POST -F "file=@image.jpg" http://localhost:8000/api/v1/remove-bg
# {"job_id":"abc-123","message":"Image uploaded successfully.","total_images":1}

# Poll status
curl http://localhost:8000/api/v1/status/abc-123

# Download (when completed)
curl -o output.png http://localhost:8000/api/v1/download/abc-123/image-id
```

## Development

### Quality Checks (Backend)

```bash
cd backend && source venv/bin/activate

ruff check app/                                    # Lint
ruff format --check app/                           # Format check
mypy app/                                          # Type check
pytest tests/ --cov=app --cov-fail-under=80        # Tests + coverage
```

### Quality Checks (Frontend)

```bash
cd frontend

npx next lint          # ESLint
npm run build          # TypeScript + Next.js build
npx vitest run         # Unit tests
```

### Stress Testing

```bash
cd backend && source venv/bin/activate
locust -f tests/stress/locustfile.py --host http://localhost:8000
# Open http://localhost:8089
```

### Git Workflow

```
main (protected)
  └── feat/phase-X-description
        └── PR with tests passing → squash merge → delete branch
```

- Branch naming: `feat/`, `fix/`, `test/`, `ci/`, `docs/`
- Commit style: Conventional Commits (`feat:`, `fix:`, `test:`, `ci:`)
- All CI checks must pass before merge

### Quality Gates (per PR)

| Check | Tool | Threshold |
|-------|------|-----------|
| Backend lint | `ruff check` | 0 errors |
| Backend format | `ruff format --check` | 0 diffs |
| Backend types | `mypy` | 0 errors |
| Backend tests | `pytest --cov` | 80% coverage |
| Frontend lint | `eslint` | 0 errors |
| Frontend build | `next build` | 0 errors |
| Frontend tests | `vitest run` | All passing |

## Configuration

```env
# Backend (.env)
DEBUG=false
MAX_FILE_SIZE=20971520        # 20MB
MAX_BATCH_SIZE=20
MAX_RESOLUTION=25000000       # 25 megapixels
RETENTION_HOURS=24
CORS_ORIGINS=["http://localhost:3000"]

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Project Structure

```
bg-remover/
├── .github/workflows/
│   ├── backend-ci.yml         # Backend CI pipeline
│   └── frontend-ci.yml        # Frontend CI pipeline
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── config.py          # Settings
│   │   ├── api/v1/endpoints/  # Route handlers
│   │   ├── models/schemas.py  # Pydantic models
│   │   ├── services/          # Business logic
│   │   └── utils/             # Validators, cleanup
│   ├── tests/
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # API flow tests
│   │   └── stress/            # Locust load tests
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── pyproject.toml         # Ruff, mypy, pytest config
├── frontend/
│   ├── src/
│   │   ├── app/               # Next.js pages + layout
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom hooks (bg removal, canvas customization)
│   │   ├── lib/               # API client, canvas compositor
│   │   ├── store/             # Zustand store
│   │   └── __tests__/         # Vitest tests
│   ├── vitest.config.ts
│   └── package.json
└── docker-compose.yml
```

## License

MIT

## Acknowledgments

- [rembg](https://github.com/danielgatis/rembg) — Background removal library
- [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) — Bilateral Reference Network
- [LaMa](https://github.com/advimman/lama) — Large Mask Inpainting (Phase 5)
