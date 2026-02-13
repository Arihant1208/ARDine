# Backend (Controllers + AI) Instructions

## Scope
- Primary folders: `backend/`, `src/shared/services/api.ts` (API boundary), `src/shared/types.ts` (shared types)
- Backend code is TypeScript modules used as controllers/services in this repo.

## Architecture
- Controllers:
  - `backend/menuController.ts`: image → AI analysis → model generation status tracking.
  - `backend/orderController.ts`: order creation and status transitions.
- Validation:
  - All external inputs are validated before data operations (see `backend/validators.ts`).
- Persistence:
  - Use repositories in `database/repositories.ts`; do not directly manipulate the DB client in controllers.

## AI Integration (Gemini)
- Keep AI outputs strictly typed and schema-validated.
- Treat AI responses as untrusted:
  - Validate shape and constraints.
  - Never execute AI-generated content.

## Error Handling
- Fail closed:
  - Return explicit errors for missing/invalid inputs.
  - Avoid partial writes when a multi-step operation fails.
- Use consistent error types/messages so the frontend can display safe copy.

## Web Security (Backend)
- Secrets:
  - `GEMINI_API_KEY` must be server-side only.
  - Do not embed secrets into client bundles.
- Input validation:
  - Validate uploaded images: size limits, type checks, and reject unexpected formats.
  - Validate order payloads: required fields, item quantities > 0, valid status transitions.
- Abuse protection (when a real server exists):
  - Add rate limiting for AI endpoints.
  - Add request size limits and timeouts.
- Logging:
  - Never log secrets or full request bodies containing PII/payment data.

## Conventions
- Prefer pure functions for transformers.
- Keep async orchestration readable:
  - small helpers
  - clear status updates
  - avoid deeply nested promises
