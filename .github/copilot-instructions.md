# ARDine AI Copilot Instructions (Index)

Use the scoped instructions below depending on which part of the repo you are modifying.

## Scopes

- Frontend (React UI, AR, features/components): `.github/instructions/frontend.md`
- Backend (controllers, AI orchestration, validation): `.github/instructions/backend.md`
- Database (repositories, db client, data model): `.github/instructions/database.md`
- Infrastructure (Docker, Helm, queue, storage): `.github/instructions/infrastructure.md`
- Repo conventions + web security: `.github/instructions/repo-and-security.md`

## High-level Architecture

Containerized microservice architecture (8 containers via Docker Compose):

- **Frontend** (Nginx) → SPA + reverse proxy for `/api` and `/storage`
- **Backend** (Express) → API controllers + helmet + rate limiting + JWT auth + Stripe
- **Worker** (BullMQ consumer) → 3D model generation pipeline
- **PostgreSQL** → persistent relational data (parameterized queries)
- **Redis** → BullMQ job queue broker
- **MinIO** → S3-compatible blob storage (dish images + `.glb` models)
- **ClamAV** → malware scanning for all uploaded/generated files
- **OTel Collector** → traces/metrics (swap exporter per cloud)

### Key Boundaries

- UI calls the API layer in `src/shared/services/api.ts` (no ad-hoc `fetch` in components).
- Client-side routing via React Router (`react-router-dom`), defined in `src/main.tsx`.
- Global state via Zustand stores in `src/stores/` (auth, cart, owner data, toasts).
- Controllers live in `backend/` and use `backend/validators.ts` for input validation.
- Owner routes are protected by `backend/authMiddleware.ts` (JWT via `requireAuth`).
- Persistence is encapsulated in `database/repositories.ts` (controllers should not reach into `database/dbClient.ts`).
- File storage uses `backend/storageClient.ts` (S3-compatible, not filesystem).
- 3D generation is enqueued via `backend/queue.ts`, processed by `backend/worker.ts`.
- Payments use `backend/stripeClient.ts` (Stripe PaymentIntents API).
- Shared types and unions live in `src/shared/types.ts` (import via the `@/` alias).

## Development

```bash
# Option 1: Docker Compose (recommended)
cp .env.example .env
# Set GEMINI_API_KEY, GOOGLE_CLIENT_ID, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
docker compose up --build

# Option 2: Local dev (requires running PostgreSQL, Redis, MinIO)
npm install
# Put secrets in .env.local (including VITE_GOOGLE_CLIENT_ID, VITE_STRIPE_PUBLISHABLE_KEY)
npm run dev          # Terminal 1: frontend
npm run backend:dev  # Terminal 2: backend
npm run worker:dev   # Terminal 3: worker
```

## Critical Security Note

Never ship secrets to the browser. `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, and `JWT_SECRET` are server-side only.
Only `VITE_GOOGLE_CLIENT_ID` and `VITE_STRIPE_PUBLISHABLE_KEY` are safe to embed in the frontend bundle.
All uploads are scanned with ClamAV before being written to blob storage.
