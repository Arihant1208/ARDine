# Backend (Controllers + AI + Worker) Instructions

## Scope
- Primary folders: `backend/`, `src/shared/services/api.ts` (API boundary), `src/shared/types.ts` (shared types)
- Backend code is TypeScript modules running in two containers: **API server** and **Worker**.

## Architecture
- **Controllers** (run in the API container):
  - `backend/menuController.ts`: image → ClamAV scan → MinIO upload → Gemini AI → BullMQ enqueue. Also handles dish deletion (images + models cleanup).
  - `backend/orderController.ts`: order creation with customer info, Stripe PaymentIntent creation, payment confirmation, webhook handling, status transitions with state-machine enforcement.
- **Auth & Payments**:
  - `backend/authMiddleware.ts`: JWT sign/verify + `requireAuth` Express middleware. Owner routes require a valid JWT with matching userId param.
  - `backend/stripeClient.ts`: Stripe PaymentIntent creation, webhook event construction, PI retrieval.
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
  - Customer info: name required, phone validated against international format.
  - Order status transitions: enforced via `ORDER_STATUS_TRANSITIONS` state machine.
- **Persistence**:
  - Use repositories in `database/repositories.ts`; do not directly manipulate the DB client.
- **Security middleware** (`backend/server.ts`):
  - `helmet` for HTTP security headers (CSP allows Google + Stripe domains).
  - `express-rate-limit`: 200 req/15min general, 20 req/15min for AI endpoints.
  - Stripe webhook route uses `express.raw()` before `express.json()` for signature verification.
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
  - `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, and `JWT_SECRET` must be server-side only.
  - Only `STRIPE_PUBLISHABLE_KEY` and `GOOGLE_CLIENT_ID` are safe for the frontend.
- Authentication:
  - Google OAuth ID tokens are verified server-side via `google-auth-library`.
  - JWT tokens are signed with HS256 and include `userId` + `email`.
  - `requireAuth` middleware checks Bearer token + userId param match on owner routes.
- Payment security:
  - Stripe PaymentIntents are created server-side; the frontend only confirms via `stripe.js`.
  - Stripe webhooks are verified using the webhook signing secret.
  - Never log full payment data or Stripe secrets.
- Input validation:
  - Validate uploaded images: magic bytes, size cap (5 MB), MIME type.
  - Validate order payloads: required fields, item quantities > 0, customer name/phone.
  - Validate status transitions: only allow transitions defined in `ORDER_STATUS_TRANSITIONS`.
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
