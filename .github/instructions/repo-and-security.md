# Repo Conventions + Web Security

## Project Layout
- Frontend: `src/App.tsx`, `src/main.tsx`, `src/features/`, `src/shared/`, `src/stores/`
- Backend API: `backend/server.ts`, `backend/menuController.ts`, `backend/orderController.ts`
- Auth: `backend/authMiddleware.ts` (JWT), `@react-oauth/google` (frontend)
- Payments: `backend/stripeClient.ts`, `@stripe/stripe-js` (frontend)
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
  - `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, `JWT_SECRET` are server-side only.
  - Only `VITE_GOOGLE_CLIENT_ID` and `VITE_STRIPE_PUBLISHABLE_KEY` are safe for the frontend.
  - Environment variables for all secrets — see `.env.example`.
- Authentication:
  - Google OAuth 2.0: ID tokens verified server-side via `google-auth-library`.
  - JWT tokens signed with HS256, include `userId` + `email`.
  - `requireAuth` middleware on all owner routes; userId in JWT must match URL param.
- Payment security:
  - Stripe PaymentIntents created server-side; frontend confirms via `stripe.js`.
  - Stripe webhook signature verification using `STRIPE_WEBHOOK_SECRET`.
  - Webhook route uses `express.raw()` before `express.json()` for raw body access.
- Input validation everywhere:
  - Validate route params (`:userId`, `:dishId`, `:orderId`) and order payloads.
  - Reject unexpected enum/status transitions via `ORDER_STATUS_TRANSITIONS`.
  - Customer info: name required, phone validated against international format.
  - Image uploads: magic-byte verification (PNG/JPEG/WebP), 5 MB size cap.
- Malware scanning:
  - All uploaded and generated files are scanned by ClamAV before writing to blob storage.
- HTTP hardening:
  - `helmet` middleware adds CSP (allows Google + Stripe domains), X-Frame-Options, X-Content-Type-Options.
  - Rate limiting: 200 req/15min general, 20 req/15min for AI endpoints.
- XSS protections:
  - Avoid `dangerouslySetInnerHTML`.
  - Render untrusted strings as text.
- Database:
  - All queries use parameterized statements — no SQL injection surface.

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
