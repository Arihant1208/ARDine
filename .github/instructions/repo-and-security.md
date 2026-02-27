# Repo Conventions + Web Security

## Project Layout
- Frontend: `src/App.tsx`, `src/features/`, `src/shared/`, `src/stores/`
- Backend API: `backend/server.ts`, `backend/menuController.ts`, `backend/orderController.ts`
- Worker: `backend/worker.ts`
- Infrastructure clients: `backend/storageClient.ts`, `backend/scannerClient.ts`, `backend/queue.ts`
- Data access: `database/`
- Shared types: `src/shared/types.ts`
- Docker: `Dockerfile.frontend`, `Dockerfile.backend`, `Dockerfile.worker`, `docker-compose.yml`, `docker/`
- Helm: `helm/ardine/`

## Codebase Management
- Prefer small PRs scoped to a single concern.
- Keep boundaries intact:
  - UI must call `src/shared/services/api.ts`, not controller files directly.
  - Controllers must call repositories, not the DB client.
  - File I/O goes through `backend/storageClient.ts` (S3-compatible), never the local filesystem.
  - 3D generation is enqueued via `backend/queue.ts`, never run inline.
- Avoid introducing new libraries unless they materially improve reliability.

## TypeScript Standards
- No `any` in new code.
- Keep shared/public types in `src/shared/types.ts`.
- Prefer exhaustive handling for status unions.

## Dependency Hygiene
- Pin changes deliberately and keep `npm audit` clean when possible.
- Avoid adding heavy dependencies for small utilities.
- Platform-agnostic only: no AWS/Azure/GCP-specific SDKs except S3-compatible (`@aws-sdk/client-s3`).

## Web Security Checklist
- Secrets never in client bundles:
  - Do not expose `GEMINI_API_KEY` via Vite `define`.
  - Use server-side endpoints/proxies for secret-bearing calls.
  - Environment variables for all secrets — see `.env.example`.
- Input validation everywhere:
  - Validate URL params (`u`, `table`) and order payloads.
  - Reject unexpected enum/status transitions.
  - Image uploads: magic-byte verification (PNG/JPEG/WebP), 5 MB size cap.
- Malware scanning:
  - All uploaded and generated files are scanned by ClamAV before writing to blob storage.
- HTTP hardening (implemented):
  - `helmet` middleware adds CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
  - Rate limiting: 200 req/15min general, 20 req/15min for AI endpoints.
- XSS protections:
  - Avoid `dangerouslySetInnerHTML`.
  - Render untrusted strings as text.
- Database:
  - All queries use parameterized statements — no SQL injection surface.
- Auth (when adding real auth):
  - Use secure sessions or JWT best practices.
  - Enforce authorization checks on every write.

## Container Conventions
- Each Dockerfile uses `node:22-alpine` as the base.
- Frontend uses multi-stage build: node builder → nginx:1.27-alpine.
- Health checks are defined in both Dockerfiles and `docker-compose.yml`.
- Never install dev dependencies in production images.
- `.dockerignore` excludes `node_modules`, `.env*`, docs.

## GitHub Actions / CI
- CI should run: `npm ci` → `npm run typecheck` → `npm run build` → `docker compose build`.
- Security: `npm audit`, ClamAV integration tests.
- Deploy should be path-scoped:
  - Frontend changes → rebuild `Dockerfile.frontend`.
  - Backend changes → rebuild `Dockerfile.backend` + `Dockerfile.worker`.
  - Helm changes → `helm upgrade`.
