# Backend (Controllers + AI + Worker) Instructions

## Scope
- Primary folders: `backend/`, `src/shared/services/api.ts` (API boundary), `src/shared/types.ts` (shared types)
- Backend code is TypeScript modules running in two containers: **API server** and **Worker**.

## Architecture
- **Controllers** (run in the API container):
  - `backend/menuController.ts`: image → ClamAV scan → MinIO upload → Gemini AI → BullMQ enqueue.
  - `backend/orderController.ts`: order creation and status transitions.
- **Worker** (separate container — `backend/worker.ts`):
  - BullMQ consumer for `model-generation` queue.
  - Processes 3D generation jobs → scans `.glb` → uploads to MinIO → updates DB.
- **Infrastructure clients** (shared between API and Worker):
  - `backend/storageClient.ts`: S3-compatible blob storage via `@aws-sdk/client-s3`.
  - `backend/scannerClient.ts`: ClamAV malware scanning over TCP (INSTREAM protocol).
  - `backend/queue.ts`: BullMQ queue config, job types, enqueue helper.
- **Validation**:
  - All external inputs are validated before data operations (see `backend/validators.ts`).
  - Images: magic-byte verification (PNG/JPEG/WebP), 5 MB size cap.
- **Persistence**:
  - Use repositories in `database/repositories.ts`; do not directly manipulate the DB client.
- **Security middleware** (`backend/server.ts`):
  - `helmet` for HTTP security headers (CSP, X-Frame-Options, etc.).
  - `express-rate-limit`: 200 req/15min general, 20 req/15min for AI endpoints.
- **Observability** (`backend/instrumentation.ts`):
  - OpenTelemetry auto-instrumentation for Express, `pg`, `ioredis`, HTTP.

## AI Integration (Gemini)
- Keep AI outputs strictly typed and schema-validated.
- Treat AI responses as untrusted:
  - Validate shape and constraints.
  - Never execute AI-generated content.
- The `geometricPrompt` from Gemini is passed to the worker via the BullMQ job.

## Queue & Worker Pattern
- **Producer** (menuController): `enqueueModelGeneration({ dishId, userId, geometricPrompt, imageUrl })`
- **Consumer** (worker.ts): processes jobs with concurrency=2, 3 retries, exponential backoff.
- Job progress is tracked via `MenuRepository.updateDishStatus()` — the frontend polls for changes.
- The worker scans generated files with ClamAV before uploading to blob storage.

## Blob Storage
- Two buckets: `dish-images` (2D photos) and `dish-models` (`.glb` files).
- Use `uploadFile()` from `backend/storageClient.ts` — never write to the local filesystem.
- Store only URLs in the database, never base64 data.

## Error Handling
- Fail closed:
  - Return explicit errors for missing/invalid inputs.
  - Avoid partial writes when a multi-step operation fails.
- Use consistent error types/messages so the frontend can display safe copy.
- Worker failures: jobs retry 3× with exponential backoff; failed jobs are preserved for inspection.

## Web Security (Backend)
- Secrets:
  - `GEMINI_API_KEY` must be server-side only.
  - Do not embed secrets into client bundles.
- Input validation:
  - Validate uploaded images: magic bytes, size cap (5 MB), MIME type.
  - Validate order payloads: required fields, item quantities > 0, valid status transitions.
- Abuse protection:
  - Rate limiting is active on all `/api` routes (stricter on AI endpoints).
  - ClamAV scans all uploaded and generated files.
- Logging:
  - Never log secrets or full request bodies containing PII/payment data.

## Conventions
- Prefer pure functions for transformers.
- Keep async orchestration readable:
  - small helpers
  - clear status updates
  - avoid deeply nested promises
