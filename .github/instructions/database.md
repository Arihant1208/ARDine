# Database Layer Instructions

## Scope
- Primary folders: `database/`
- This repo uses an in-memory singleton `PostgresClient` for development/demo behavior.

## Architecture
- Only repositories talk to the DB client.
  - Use `database/repositories.ts` as the CRUD boundary.
  - Controllers/services should depend on repository methods, not the DB client.

## Data Model
- Keep shared types in `types.ts`.
- Status enums:
  - `ModelGenerationStatus`: `pending | generating | ready | failed`.
  - `Order.status`: `received | preparing | served | paid`.

## Conventions
- Repository methods should:
  - Be small and single-purpose.
  - Accept typed inputs, return typed outputs.
  - Avoid leaking internal DB shapes to callers.
- Prefer deterministic behavior for demo seed data.

## Security (DB)
- If/when moving to a real DB:
  - Use parameterized queries (avoid SQL injection).
  - Use migrations instead of ad-hoc schema changes.
  - Use least-privilege credentials per environment.
  - Avoid storing secrets in the repo; use GitHub Secrets / environment variables.

## Testing Guidance
- Keep repository logic testable by injecting or abstracting the DB client.
- Avoid coupling tests to real network DBs unless explicitly required.
