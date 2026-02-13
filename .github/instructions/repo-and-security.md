# Repo Conventions + Web Security

## Project Layout
- Frontend: `src/App.tsx`, `src/features/`, `src/shared/`, `src/stores/`
- Backend/controllers: `backend/`
- Data access: `database/`
- Shared types: `src/shared/types.ts`

## Codebase Management
- Prefer small PRs scoped to a single concern.
- Keep boundaries intact:
  - UI must call `src/shared/services/api.ts`, not controller files directly.
  - Controllers must call repositories, not the DB client.
- Avoid introducing new libraries unless they materially improve reliability.

## TypeScript Standards
- No `any` in new code.
- Keep shared/public types in `src/shared/types.ts`.
- Prefer exhaustive handling for status unions.

## Dependency Hygiene
- Pin changes deliberately and keep `npm audit` clean when possible.
- Avoid adding heavy dependencies for small utilities.

## Web Security Checklist
- Secrets never in client bundles:
  - Do not expose `GEMINI_API_KEY` via Vite `define`.
  - Use server-side endpoints/proxies for secret-bearing calls.
- Input validation everywhere:
  - Validate URL params (`u`, `table`) and order payloads.
  - Reject unexpected enum/status transitions.
- XSS protections:
  - Avoid `dangerouslySetInnerHTML`.
  - Render untrusted strings as text.
- Clickjacking/CSP (when deploying a real server):
  - Add `Content-Security-Policy`, `X-Frame-Options` or `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`.
- Auth (when adding real auth):
  - Use secure sessions or JWT best practices.
  - Enforce authorization checks on every write.

## GitHub Actions
- CI should run `npm ci`, `npm run typecheck`, `npm run build`.
- Deploy should be path-scoped:
  - Frontend changes → build + deploy frontend.
  - Backend/DB changes → build/check only (or deploy to your chosen server target).
