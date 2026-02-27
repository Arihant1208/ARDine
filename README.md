# AR-Dine: Interactive Menu & Ordering

An AI-powered AR menu experience for restaurants with separate views for customers and owners. Fully containerized, platform-agnostic architecture deployable on Azure, AWS, or GCP.

## 📁 Project Structure

```
ARDine/
├── src/                      # Frontend source code
│   ├── features/            # Feature-based modules
│   │   ├── auth/           # Authentication (Login/Signup)
│   │   ├── customer/       # Customer views (Menu, AR, Cart)
│   │   ├── owner/          # Owner dashboard (Orders, Menu Management)
│   │   └── landing/        # Landing page
│   ├── shared/             # Shared resources
│   │   ├── components/     # Reusable UI components
│   │   ├── layout/         # Layout components (Header, etc.)
│   │   ├── services/       # API clients
│   │   └── types.ts        # TypeScript types
│   ├── stores/             # Zustand state management
│   └── App.tsx
├── backend/                 # Express backend + worker
│   ├── db/                 # Database setup & seed
│   ├── menuController.ts   # Image → AI → MinIO → BullMQ enqueue
│   ├── orderController.ts  # Order CRUD + status transitions
│   ├── server.ts           # Express API with helmet, rate limiting
│   ├── worker.ts           # BullMQ consumer for 3D model generation
│   ├── queue.ts            # Shared queue config & job types
│   ├── storageClient.ts    # S3-compatible blob storage client
│   ├── scannerClient.ts    # ClamAV malware scanning client
│   ├── instrumentation.ts  # OpenTelemetry auto-instrumentation
│   ├── aiClient.ts         # Gemini AI client factory
│   └── validators.ts       # Magic-byte + size validation
├── database/               # Data-access boundary
│   ├── dbClient.ts        # PostgreSQL client (pg Pool)
│   └── repositories.ts    # Repository pattern CRUD layer
├── docker/                 # Container configuration
│   ├── nginx.conf         # Frontend reverse proxy config
│   └── otel-collector-config.yaml
├── helm/                   # Kubernetes Helm chart
│   └── ardine/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/     # Deployment, Service, Ingress, etc.
├── Dockerfile.frontend     # Multi-stage: Vite build → Nginx
├── Dockerfile.backend      # Node 22 alpine → Express API
├── Dockerfile.worker       # Node 22 alpine → BullMQ consumer
├── docker-compose.yml      # Local orchestration (8 services)
└── .env.example           # All environment variables documented
```

## 🏗️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│    Worker    │
│  (Nginx:80)  │     │(Express:4000)│     │  (BullMQ)    │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
              ┌─────────────┼─────────────────────┤
              ▼             ▼                     ▼
        ┌──────────┐  ┌──────────┐         ┌──────────┐
        │PostgreSQL│  │  Redis   │         │  MinIO   │
        │  :5432   │  │  :6379   │         │(S3):9000 │
        └──────────┘  └──────────┘         └──────────┘
                                                │
                      ┌──────────┐         ┌────┴─────┐
                      │  OTel    │         │  ClamAV  │
                      │Collector │         │  :3310   │
                      │:4317/4318│         └──────────┘
                      └──────────┘
```

### Data Flow

1. **React SPA** → calls `src/shared/services/api.ts` → Nginx reverse-proxies `/api` to backend
2. **Express API** → validates input → scans images with ClamAV → uploads to MinIO (S3-compatible) → analyzes with Gemini AI → enqueues BullMQ job
3. **Worker** → picks up job from Redis → simulates/generates 3D model → scans `.glb` with ClamAV → uploads to MinIO → updates PostgreSQL
4. **Frontend polls** `/api/users/:id/menu` every 5s until `modelGenerationStatus === 'ready'`
5. **AR Viewer** → renders `arModelUrl` (MinIO URL proxied via `/storage`) in `<model-viewer>` web component

### Platform-Agnostic Design

Every component uses open standards — **no cloud vendor lock-in**:

| Component | Local (Docker Compose) | Azure | AWS | GCP |
|-----------|----------------------|-------|-----|-----|
| Database | `postgres:16-alpine` | Azure DB for PostgreSQL | RDS / Aurora | Cloud SQL |
| Queue | `redis:7-alpine` | Azure Cache for Redis | ElastiCache | Memorystore |
| Blob Storage | `minio/minio` (S3 API) | Azure Blob (S3 gateway) | S3 | Cloud Storage |
| Malware Scan | `clamav/clamav` | Defender for Storage | GuardDuty | SCC |
| Observability | OTel Collector | Azure Monitor | X-Ray | Cloud Trace |
| Orchestration | Docker Compose | AKS | EKS | GKE |

Only the **connection strings / env vars** change between environments — zero code changes.

## 🚀 Getting Started

### Option 1: Docker Compose (Recommended)

Run the entire stack locally with a single command:

```bash
# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env — at minimum set GEMINI_API_KEY

# 2. Start all 8 containers
docker compose up --build

# 3. Access the app
#    Frontend:       http://localhost
#    Backend API:    http://localhost:4000
#    MinIO Console:  http://localhost:9001 (minioadmin / minioadmin)
#    PostgreSQL:     localhost:5432

# Scale workers for parallel 3D generation
docker compose up --scale worker=3

# Tear down
docker compose down
```

**What starts:** Frontend (Nginx), Backend (Express), Worker (BullMQ), PostgreSQL, Redis, MinIO, ClamAV, OpenTelemetry Collector.

### Option 2: Local Development (without Docker)

For iterating on code without rebuilding containers:

```bash
# Prerequisites: Node.js 22+, running PostgreSQL, Redis, MinIO instances

npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with local connection strings

# Terminal 1: Frontend (Vite dev server with HMR)
npm run dev

# Terminal 2: Backend API
npm run backend:dev

# Terminal 3: 3D Worker
npm run worker:dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

### Environment Variables

All variables are documented in `.env.example`. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (server-side only) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string for BullMQ |
| `S3_ENDPOINT` | Yes | MinIO / S3-compatible endpoint |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Yes | Blob storage credentials |
| `CLAMAV_HOST` | No | ClamAV daemon host (default: `clamav`) |
| `STORAGE_PUBLIC_URL` | No | Public base URL for stored files |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OpenTelemetry collector endpoint |

## 🐳 Container Architecture

### Services (docker-compose.yml)

| Service | Image | Ports | Purpose |
|---------|-------|-------|---------|
| `frontend` | `Dockerfile.frontend` | `80` | Nginx SPA + reverse proxy |
| `backend` | `Dockerfile.backend` | `4000` | Express API server |
| `worker` | `Dockerfile.worker` | — | BullMQ 3D generation consumer |
| `db` | `postgres:16-alpine` | `5432` | Persistent relational data |
| `redis` | `redis:7-alpine` | `6379` | Job queue (BullMQ) broker |
| `minio` | `minio/minio` | `9000` / `9001` | S3-compatible blob storage |
| `clamav` | `clamav/clamav:stable` | `3310` | Malware scanning daemon |
| `otel-collector` | `otel/opentelemetry-collector-contrib` | `4317` / `4318` | Telemetry collection |

### Blob Storage (MinIO — S3-compatible)

Two buckets are auto-created on startup:
- **`dish-images`** — 2D dish photos (uploaded during menu analysis)
- **`dish-models`** — `.glb` 3D model files (generated by worker)

The `storageClient.ts` uses `@aws-sdk/client-s3` — works unchanged against MinIO, AWS S3, GCS (HMAC), or Azure Blob (S3 gateway).

### Message Queue (Redis + BullMQ)

The 3D model generation pipeline is decoupled from the API:

1. `POST /api/users/:id/menu/analyze` → saves dish → enqueues `model-generation` job
2. Worker picks up job → generates model → scans with ClamAV → uploads `.glb` → updates DB
3. Frontend polls until `modelGenerationStatus === 'ready'`

Jobs support: 3 retries with exponential backoff, rate limiting (10/min), progress tracking.

### Security Scanning (ClamAV)

All user-uploaded files are scanned **before** being written to blob storage:
- 2D images: scanned in the `/analyze` API endpoint
- 3D models: scanned in the worker before upload

If ClamAV is unavailable, behavior is configurable via `CLAMAV_REQUIRED=true` (fail hard) or default (warn and skip).

### Observability (OpenTelemetry)

Auto-instrumented traces/metrics for Express, `pg`, `ioredis`, and HTTP calls. The collector config (`docker/otel-collector-config.yaml`) exports to console by default — uncomment the relevant exporter for production:

```yaml
# Azure Monitor:
# azuremonitor:
#   connection_string: ${APPLICATIONINSIGHTS_CONNECTION_STRING}

# AWS X-Ray:
# awsxray:
#   region: ${AWS_REGION}

# GCP Cloud Trace:
# googlecloud:
#   project: ${GCP_PROJECT_ID}
```

## ☸️ Kubernetes Deployment (Helm)

A Helm chart is provided in `helm/ardine/` for deploying to any managed Kubernetes cluster (AKS, EKS, GKE).

```bash
# Build and push images to your OCI registry
docker build -f Dockerfile.frontend -t ghcr.io/your-org/ardine-frontend:latest .
docker build -f Dockerfile.backend  -t ghcr.io/your-org/ardine-backend:latest .
docker build -f Dockerfile.worker   -t ghcr.io/your-org/ardine-worker:latest .

# Deploy to cluster
helm install ardine ./helm/ardine \
  --set secrets.geminiApiKey=YOUR_KEY \
  --set image.frontend.repository=ghcr.io/your-org/ardine-frontend \
  --set image.backend.repository=ghcr.io/your-org/ardine-backend \
  --set image.worker.repository=ghcr.io/your-org/ardine-worker
```

### Using Managed Services (Production)

Disable containerized infra and point to managed equivalents:

```yaml
# values.yaml overrides for production
postgresql:
  enabled: false
externalDatabase:
  host: your-db.postgres.database.azure.com
  password: xxx

redis:
  enabled: false
externalRedis:
  host: your-cache.redis.cache.windows.net

minio:
  enabled: false
externalStorage:
  endpoint: https://s3.amazonaws.com
  accessKey: xxx
  secretKey: xxx
  forcePathStyle: false
```

## 🛠️ Development

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `vite` | Frontend dev server (port 3000) |
| `npm run backend:dev` | `tsx backend/server.ts` | Backend API server (port 4000) |
| `npm run worker:dev` | `tsx backend/worker.ts` | 3D model worker |
| `npm run build` | `vite build` | Production frontend build |
| `npm run typecheck` | `tsc --noEmit` | TypeScript type checking |
| `npm run verify` | typecheck + build | CI verification |
| `npm run db:setup` | `tsx backend/db/setup.ts` | Apply SQL schema to PostgreSQL |
| `npm run docker:up` | `docker compose up --build` | Start all containers |
| `npm run docker:down` | `docker compose down` | Stop all containers |
| `npm run docker:logs` | `docker compose logs -f` | Tail all container logs |

### Code Organization

- **Features are isolated**: Each feature (auth, customer, owner) has its own directory
- **Shared code is centralized**: Common components, types, and services in `src/shared/`
- **State is managed globally**: Zustand stores provide global state management
- **Backend is modular**: Controllers → Validators → Repositories → DB Client
- **Worker is decoupled**: 3D generation runs in a separate container via BullMQ
- **Storage is abstracted**: S3-compatible client works with MinIO, AWS S3, GCS, Azure Blob

### Security Measures

| Layer | Implementation |
|-------|---------------|
| HTTP headers | `helmet` middleware (CSP, X-Frame-Options, etc.) |
| Rate limiting | `express-rate-limit` — 200 req/15min general, 20 req/15min for AI |
| Image validation | Magic-byte verification (PNG/JPEG/WebP), 5 MB size cap |
| Malware scanning | ClamAV INSTREAM protocol on all uploads |
| SQL injection | Parameterized queries throughout `dbClient.ts` |
| Secrets | Server-side only — never shipped to browser bundles |

## 🔑 Key Features

### For Customers
- Browse AR-enabled menu
- View 3D models of dishes in augmented reality
- Add items to cart
- Place orders with multiple payment methods (UPI, Card, Cash, Wallet)

### For Owners
- Upload menu photos — AI generates dish metadata + 3D generation prompt
- Track 3D model generation progress in real-time
- Manage restaurant configuration
- View live orders dashboard with status transitions
- Generate QR codes for tables

## 📝 Notes

- **Database**: PostgreSQL with parameterized queries (previously in-memory Maps)
- **AI**: Google Gemini API for dish photo analysis (API key-based, works from any cloud)
- **3D Models**: Generation pipeline runs in a separate worker container via BullMQ queue. Currently uses a placeholder model — replace `fetchPlaceholderModel()` in `backend/worker.ts` with a real pipeline (Shap-E, TripoSR, etc.)
- **Auth**: Basic email/password — implement proper JWT/OAuth for production
- **ClamAV cold start**: Takes ~60–120s on first boot to download virus definitions. The health check has a `start_period` of 120s

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run verify` (typecheck + build)
4. Run `docker compose up --build` to validate containers
5. Submit a pull request

## 📄 License

MIT
