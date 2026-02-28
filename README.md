# AR-Dine: Interactive Menu & Ordering

An AI-powered AR menu experience for restaurants with separate flows for customers and owners. Google OAuth authentication, Stripe payments, real-time order tracking, and 3D dish previews. Fully containerized, platform-agnostic architecture deployable on Azure, AWS, or GCP.

## 📁 Project Structure

```
ARDine/
├── src/                          # Frontend source code
│   ├── main.tsx                 # BrowserRouter + GoogleOAuthProvider + route tree
│   ├── App.tsx                  # Thin shell: session restore + <Outlet /> + <Toast />
│   ├── features/
│   │   ├── auth/
│   │   │   └── AuthView.tsx     # Google OAuth login + demo login
│   │   ├── customer/
│   │   │   ├── CustomerMenuView.tsx   # Browse menu, AR preview, add to cart
│   │   │   ├── CustomerCartView.tsx   # Cart editing, customer info, Stripe/Cash checkout
│   │   │   └── components/
│   │   │       ├── ARViewer.tsx        # <model-viewer> AR modal
│   │   │       └── PaymentSelector.tsx # UPI / Card / Cash selector
│   │   ├── owner/
│   │   │   ├── OwnerSetupView.tsx     # Menu upload, dish management, config, QR codes
│   │   │   ├── OwnerDashboardView.tsx # Live order feed with status transitions
│   │   │   └── components/
│   │   │       └── OrderCard.tsx       # Order card with customer info + status buttons
│   │   └── landing/
│   │       └── LandingView.tsx         # Landing page with navigation links
│   ├── shared/
│   │   ├── types.ts             # All shared TypeScript types + order state machine
│   │   ├── components/
│   │   │   ├── OwnerGuard.tsx   # Auth route guard for owner pages
│   │   │   ├── QRGenerator.tsx  # Table QR code generator
│   │   │   ├── Toast.tsx        # Global toast notifications
│   │   │   └── ui/             # Button, Card, Badge primitives
│   │   ├── layout/
│   │   │   └── Header.tsx
│   │   └── services/
│   │       └── api.ts           # API client with JWT auth header injection
│   └── stores/                  # Zustand state stores
│       ├── useAuthStore.ts      # Google OAuth + session persistence
│       ├── useCartStore.ts      # Cart items, customer info, payment flow
│       ├── useOwnerStore.ts     # Menu, config, orders for owner
│       └── useToastStore.ts     # Toast notification state
├── backend/
│   ├── server.ts               # Express API: routes, auth, Stripe webhook, CSP
│   ├── authMiddleware.ts       # JWT sign/verify + requireAuth middleware
│   ├── stripeClient.ts         # Stripe PaymentIntent creation + webhook verification
│   ├── menuController.ts       # Image → AI → MinIO → BullMQ (+ dish deletion)
│   ├── orderController.ts      # Order CRUD, payment intents, status state machine
│   ├── validators.ts           # Input validation + status transition enforcement
│   ├── worker.ts               # BullMQ consumer for 3D model generation
│   ├── queue.ts                # Shared queue config & job types
│   ├── storageClient.ts        # S3-compatible blob storage client
│   ├── scannerClient.ts        # ClamAV malware scanning client
│   ├── aiClient.ts             # Gemini AI client factory
│   ├── instrumentation.ts      # OpenTelemetry auto-instrumentation
│   └── db/
│       ├── schema.sql          # PostgreSQL schema (auto-applied on first boot)
│       ├── seed.ts             # Demo data seeder
│       └── setup.ts            # Manual schema applicator
├── database/
│   ├── dbClient.ts             # PostgreSQL client (pg Pool, parameterized queries)
│   └── repositories.ts         # Repository pattern CRUD layer
├── docker/
│   ├── nginx.conf              # Nginx reverse proxy + SPA fallback
│   └── otel-collector-config.yaml
├── helm/ardine/                # Kubernetes Helm chart (AKS / EKS / GKE)
├── Dockerfile.frontend         # Multi-stage: Vite build → Nginx
├── Dockerfile.backend          # Node 22 alpine → Express API
├── Dockerfile.worker           # Node 22 alpine → BullMQ consumer
├── docker-compose.yml          # Local orchestration (8 services)
└── .env.example                # All environment variables documented
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

1. **Owner onboarding**: Google OAuth → JWT → upload menu photo → Gemini AI analyzes dishes → stores to MinIO + PostgreSQL → enqueues 3D generation via BullMQ
2. **3D generation**: Worker picks up job → generates model → ClamAV scan → uploads `.glb` to MinIO → updates PostgreSQL status
3. **Customer ordering**: Scans QR code → browses menu → adds items to cart → enters name + phone → pays via Stripe or Cash → order created in PostgreSQL
4. **Payment flow (Stripe)**: Frontend creates PaymentIntent via backend → Stripe.js confirms → webhook updates order payment status
5. **Order management**: Owner dashboard polls orders → advances status through state machine (received → preparing → ready → served / cancelled)

### Order Status State Machine

```
received ──▶ preparing ──▶ ready ──▶ served
    │            │           │
    └────────────┴───────────┴──▶ cancelled
```

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

## 🚀 Getting Started

### Prerequisites

- **Docker Desktop** (for Docker Compose) or **Node.js 22+** (for local dev)
- A **Google Cloud OAuth 2.0 Client ID** ([create one here](https://console.cloud.google.com/apis/credentials))
- A **Stripe account** with test API keys ([get keys here](https://dashboard.stripe.com/test/apikeys))
- A **Gemini API key** ([get one here](https://aistudio.google.com/apikey))

### Option 1: Docker Compose (Recommended)

Run the entire stack locally with a single command:

```bash
# 1. Copy and configure environment variables
cp .env.example .env

# 2. Edit .env — set these required values:
#    GEMINI_API_KEY=your-gemini-api-key
#    GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
#    JWT_SECRET=a-strong-random-secret
#    STRIPE_SECRET_KEY=sk_test_...
#    STRIPE_PUBLISHABLE_KEY=pk_test_...
#    STRIPE_WEBHOOK_SECRET=whsec_...  (optional for local dev)

# 3. Start all 8 containers
docker compose up --build

# 4. Access the app
#    Frontend:       http://localhost
#    Backend API:    http://localhost:4000
#    MinIO Console:  http://localhost:9001 (credentials from .env)
#    PostgreSQL:     localhost:5432

# Scale workers for parallel 3D generation
docker compose up --scale worker=3

# Tear down
docker compose down
```

**What starts:** Frontend (Nginx), Backend (Express), Worker (BullMQ), PostgreSQL, Redis, MinIO, ClamAV, OpenTelemetry Collector.

> **Note:** ClamAV takes ~60–120s on first boot to download virus definitions. The health check has a `start_period` of 120s.

### Option 2: Local Development (without Docker)

For iterating on code with hot-reload. Requires running PostgreSQL, Redis, and MinIO instances separately.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Edit .env.local:
#   GEMINI_API_KEY, GOOGLE_CLIENT_ID, JWT_SECRET
#   STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
#   VITE_GOOGLE_CLIENT_ID (same as GOOGLE_CLIENT_ID)
#   VITE_STRIPE_PUBLISHABLE_KEY (same as STRIPE_PUBLISHABLE_KEY)
#   DATABASE_URL pointing to your PostgreSQL instance

# 3. Apply database schema (first time only)
npm run db:setup

# 4. Start all three processes (each in its own terminal):

# Terminal 1: Frontend (Vite dev server with HMR, port 3000)
npm run dev

# Terminal 2: Backend API (Express, port 4000)
npm run backend:dev

# Terminal 3: 3D Worker (BullMQ consumer)
npm run worker:dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |

> **Vite proxies** `/api` requests to the backend automatically in dev mode. The `VITE_*` env vars are baked into the frontend at build time and read from `.env.local` during dev.

### Demo Login

A demo owner account is seeded automatically. On the auth page, click **"Try Demo Account"** to sign in without Google OAuth. This creates a session for the pre-seeded demo user.

### Environment Variables

All variables are documented in `.env.example`. Key ones:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (server-side only) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Client ID |
| `JWT_SECRET` | Yes | Secret for signing JWT auth tokens |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (server-side only) |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (also exposed to frontend) |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | Stripe webhook endpoint signing secret |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string for BullMQ |
| `S3_ENDPOINT` | Yes | MinIO / S3-compatible endpoint |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | Yes | Blob storage credentials |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Google Client ID for `@react-oauth/google` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Frontend | Stripe publishable key for `@stripe/stripe-js` |
| `CLAMAV_HOST` | No | ClamAV daemon host (default: `clamav`) |
| `STORAGE_PUBLIC_URL` | No | Public base URL for stored files |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | OpenTelemetry collector endpoint |

> **Frontend env vars:** Variables prefixed with `VITE_` are embedded at build time by Vite. In Docker, they are passed as build args in `docker-compose.yml`. In local dev, Vite reads them from `.env.local`.

## 🔑 Key Features

### For Customers
- Scan a QR code to open the restaurant menu (no app install needed)
- Browse dishes with descriptions, prices, and images
- View 3D models of dishes in augmented reality via `<model-viewer>`
- Add items to cart with quantity adjustments (+/−)
- Enter name and phone number at checkout (tracked per order)
- Pay via **Stripe** (UPI, Card) or **Cash**
- Real-time order status tracking

### For Owners
- **Google OAuth** login (secure, no password management)
- Upload menu photos — AI generates dish metadata + 3D generation prompt
- Delete dishes (removes images and 3D models from storage)
- Track 3D model generation progress in real-time
- Manage restaurant configuration (name, table count)
- Generate QR codes for each table
- Live orders dashboard with multi-step status transitions
- See customer name and phone on each order

### Authentication & Payments
- **Google OAuth 2.0** via `@react-oauth/google` (frontend) + `google-auth-library` (backend verification)
- **JWT tokens** for session management (stored in localStorage, injected via Authorization header)
- **Stripe PaymentIntents** for secure payment processing
- **Stripe webhooks** for reliable payment status updates
- Cash payment option (no Stripe interaction)

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
docker build -f Dockerfile.frontend -t ghcr.io/your-org/ardine-frontend:latest \
  --build-arg VITE_GOOGLE_CLIENT_ID=your-client-id \
  --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... .
docker build -f Dockerfile.backend  -t ghcr.io/your-org/ardine-backend:latest .
docker build -f Dockerfile.worker   -t ghcr.io/your-org/ardine-worker:latest .

# Deploy to cluster
helm install ardine ./helm/ardine \
  --set secrets.geminiApiKey=YOUR_KEY \
  --set secrets.googleClientId=YOUR_GOOGLE_CLIENT_ID \
  --set secrets.jwtSecret=YOUR_JWT_SECRET \
  --set secrets.stripeSecretKey=sk_live_... \
  --set secrets.stripePublishableKey=pk_live_... \
  --set secrets.stripeWebhookSecret=whsec_... \
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

### Routes (React Router)

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | `LandingView` | — | Landing page |
| `/auth` | `AuthView` | — | Google OAuth + demo login |
| `/menu/:userId` | `CustomerMenuView` | — | Customer menu (QR code target) |
| `/menu/:userId/cart` | `CustomerCartView` | — | Cart + checkout |
| `/owner/setup` | `OwnerSetupView` | JWT | Menu management + config |
| `/owner/dashboard` | `OwnerDashboardView` | JWT | Live order feed |

### API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/google` | — | Exchange Google ID token for JWT |
| `POST` | `/api/auth/demo` | — | Demo login (returns JWT) |
| `GET` | `/api/stripe/config` | — | Get Stripe publishable key |
| `POST` | `/api/users/:id/menu/analyze` | JWT | Upload + analyze menu image |
| `GET` | `/api/users/:id/menu` | — | Get menu dishes |
| `DELETE` | `/api/users/:id/menu/:dishId` | JWT | Delete a dish |
| `GET` | `/api/users/:id/config` | — | Get restaurant config |
| `PUT` | `/api/users/:id/config` | JWT | Update restaurant config |
| `POST` | `/api/users/:id/orders` | — | Place an order (customer) |
| `GET` | `/api/users/:id/orders` | JWT | List orders (owner) |
| `PATCH` | `/api/users/:id/orders/:orderId/status` | JWT | Update order status |
| `POST` | `/api/users/:id/orders/:orderId/payment-intent` | — | Create Stripe PaymentIntent |
| `POST` | `/api/users/:id/orders/:orderId/confirm-payment` | — | Confirm payment after Stripe |
| `POST` | `/api/stripe/webhook` | — | Stripe webhook handler |

### Code Organization

- **React Router** for client-side routing (BrowserRouter)
- **Zustand** for global state management (auth, cart, owner data)
- **Google OAuth 2.0** for owner authentication (no email/password)
- **Stripe** for payment processing (PaymentIntents API)
- **Features are isolated**: Each feature directory has its own views and components
- **Backend is modular**: Controllers → Validators → Repositories → DB Client
- **Worker is decoupled**: 3D generation runs in a separate container via BullMQ
- **Storage is abstracted**: S3-compatible client works with MinIO, AWS S3, GCS, Azure Blob

### Security Measures

| Layer | Implementation |
|-------|---------------|
| Authentication | Google OAuth 2.0 + JWT tokens (signed with HS256) |
| Authorization | `requireAuth` middleware on owner routes; userId param must match JWT |
| HTTP headers | `helmet` middleware (CSP allows Google + Stripe domains) |
| Rate limiting | `express-rate-limit` — 200 req/15min general, 20 req/15min for AI |
| Payment security | Stripe PaymentIntents (PCI-compliant); webhook signature verification |
| Image validation | Magic-byte verification (PNG/JPEG/WebP), 5 MB size cap |
| Malware scanning | ClamAV INSTREAM protocol on all uploads |
| SQL injection | Parameterized queries throughout `dbClient.ts` |
| Secrets | `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `JWT_SECRET` never shipped to browser |

## 📝 Notes

- **Database**: PostgreSQL with parameterized queries. Schema auto-applied on first Docker boot.
- **AI**: Google Gemini API for dish photo analysis (API key-based, works from any cloud).
- **3D Models**: Generation pipeline runs in a separate worker container via BullMQ queue. Currently uses a placeholder model — replace `fetchPlaceholderModel()` in `backend/worker.ts` with a real pipeline (Shap-E, TripoSR, etc.).
- **Auth**: Google OAuth 2.0 with JWT sessions. Owner routes are protected; customer routes are public.
- **Payments**: Stripe for card/UPI; Cash option skips Stripe entirely. Customer name + phone tracked per order.
- **ClamAV cold start**: Takes ~60–120s on first boot to download virus definitions. The health check has a `start_period` of 120s.
- **Stripe webhooks**: For production, set up a webhook endpoint in the Stripe dashboard pointing to `https://your-domain/api/stripe/webhook` with the `payment_intent.succeeded` and `payment_intent.payment_failed` events.

## 📄 License

MIT
