# Infrastructure (Docker, Helm, Queue, Storage) Instructions

## Scope
- Docker: `Dockerfile.frontend`, `Dockerfile.backend`, `Dockerfile.worker`, `docker-compose.yml`, `docker/`
- Helm: `helm/ardine/`
- Queue: `backend/queue.ts`, `backend/worker.ts`
- Storage: `backend/storageClient.ts`
- Scanner: `backend/scannerClient.ts`
- Observability: `backend/instrumentation.ts`, `docker/otel-collector-config.yaml`

## Container Architecture (8 services)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| frontend | Dockerfile.frontend | 80 | Nginx SPA + reverse proxy |
| backend | Dockerfile.backend | 4000 | Express API |
| worker | Dockerfile.worker | — | BullMQ consumer (3D generation) |
| db | postgres:16-alpine | 5432 | Relational persistence |
| redis | redis:7-alpine | 6379 | BullMQ job broker |
| minio | minio/minio | 9000/9001 | S3-compatible blob storage |
| clamav | clamav/clamav:1.4 | 3310 | Malware scanning |
| otel-collector | otel/opentelemetry-collector-contrib | 4317/4318 | Traces + metrics |

## Docker Compose

- `docker compose up --build` starts everything.
- Named volumes: `pgdata`, `redisdata`, `miniodata`, `clamavdata`.
- Single `ardine` bridge network; services reference each other by container name.
- `minio-init` ephemeral container creates buckets on first boot.
- All services include health checks; dependents use `condition: service_healthy`.

## Dockerfiles

- **Frontend** (multi-stage): `node:22-alpine` builder → `nginx:1.27-alpine` runtime.
- **Backend**: `node:22-alpine`, copies `backend/`, `database/`, `src/shared/types.ts`, production deps only.
- **Worker**: Same base as backend but no exposed port; runs `backend/worker.ts`.
- `.dockerignore` excludes `node_modules`, `.env*`, `.git/`, docs, Helm chart.

## Nginx (docker/nginx.conf)

- Reverse proxy: `/api/` → `backend:4000`, `/storage/` → `minio:9000`.
- SPA fallback: `try_files $uri $uri/ /index.html`.
- Gzip enabled for text, JS, CSS, JSON, SVG.
- Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

## Message Queue (BullMQ + Redis)

- Queue name: `model-generation`.
- Producer: `backend/queue.ts` → `enqueueModelGeneration()`.
- Consumer: `backend/worker.ts` → `processModelGeneration()`.
- Job deduplication: `jobId: model-${dishId}`.
- Retry: 3 attempts, exponential backoff (1s base).
- Concurrency: 2 concurrent jobs per worker, rate limited to 10/min.
- Redis connection config reused via `createRedisConnection()` helper.

## Blob Storage (MinIO / S3-compatible)

- Two buckets: `dish-images`, `dish-models`.
- Client: `@aws-sdk/client-s3` in `backend/storageClient.ts`.
- Operations: `uploadFile()`, `downloadFile()`, `deleteFile()`, `publicUrl()`, `bucketExists()`.
- Env vars: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`.
- Platform agnostic: swap MinIO for AWS S3, Azure Blob (S3-compat), or GCP Cloud Storage.

## Malware Scanning (ClamAV)

- Client: `backend/scannerClient.ts` using raw TCP INSTREAM protocol.
- `scanBuffer()`: sends file in 2 MB chunks, returns `clean | infected | error`.
- `pingClamAV()`: health check via PING/PONG.
- All files scanned before writing to blob storage (both uploads and generated models).

## Observability (OpenTelemetry)

- `backend/instrumentation.ts`: auto-instruments Express, pg, ioredis, HTTP.
- Collector config: `docker/otel-collector-config.yaml`.
- Default exporter: OTLP/gRPC → collector → debug exporter (swap per cloud).
- To send to a cloud backend, replace the exporter in the collector config.

## Helm Chart (helm/ardine/)

- `values.yaml` toggle flags: `postgresql.managed`, `redis.managed`, `minio.managed` — set `true` to skip deploying in-cluster and use managed services instead.
- Templates: backend deployment+service, worker deployment, frontend deployment+service, ingress, configmap, secrets.
- Secrets reference environment variables; populate via `--set` or CI secrets.
- Ingress supports `cert-manager` TLS annotations.

## Environment Variables

All config is via env vars (see `.env.example`):
- `DATABASE_URL`: Postgres connection string.
- `REDIS_URL`: Redis connection string.
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`: Blob storage.
- `CLAMAV_HOST`, `CLAMAV_PORT`: Scanner.
- `GEMINI_API_KEY`: AI (server-side only).
- `OTEL_EXPORTER_OTLP_ENDPOINT`: Telemetry.

## Platform Agnostic Principles

- Every infrastructure choice has a managed equivalent on AWS, Azure, and GCP.
- No vendor-specific SDKs except S3-compatible (`@aws-sdk/client-s3`).
- Helm values allow toggling between in-cluster and managed services.
- OTel collector exporter is cloud-swappable without code changes.
