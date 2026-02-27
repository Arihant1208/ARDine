# Database Layer Instructions

## Scope
- Primary folders: `database/`
- The database client (`database/dbClient.ts`) connects to **PostgreSQL** via a `pg` Pool using `DATABASE_URL`.

## Architecture
- Only repositories talk to the DB client.
  - Use `database/repositories.ts` as the CRUD boundary.
  - Controllers/services should depend on repository methods, not the DB client.
- The DB client uses **parameterized queries** throughout — no string interpolation.
- Transactions are used for multi-table writes (e.g., order + order_items insertion).

## Data Model
- Keep shared types in `src/shared/types.ts`.
- Status enums:
  - `ModelGenerationStatus`: `pending | generating | ready | failed`.
  - `Order.status`: `received | preparing | served | paid`.
- The `dishes` table includes `geometric_prompt TEXT` for the AI-generated 3D instructions.
- The `images TEXT[]` column stores **URLs** (to MinIO/S3), never base64.

## Schema & Migrations
- Schema: `backend/db/schema.sql` — auto-applied by Postgres on first Docker boot via `docker-entrypoint-initdb.d/`.
- Manual apply: `npm run db:setup` runs `backend/db/setup.ts` using `DATABASE_URL`.
- Seed data: `backend/db/seed.ts` inserts demo dishes with external image URLs.

## Row Mapping
- `dbClient.ts` maps snake_case Postgres columns to camelCase TypeScript types via `rowToDish()` / inline mapping.
- Keep this mapping centralized in `dbClient.ts` — do not spread it into repositories.

## Conventions
- Repository methods should:
  - Be small and single-purpose.
  - Accept typed inputs, return typed outputs.
  - Avoid leaking internal DB shapes to callers.
- Prefer deterministic behavior for demo seed data.

## Security (DB)
- All queries use parameterized statements (`$1`, `$2`, etc.) — never concatenate user input.
- Use least-privilege credentials per environment.
- `DATABASE_URL` comes from environment variables — never hardcoded.
- The Postgres container uses named volumes for data persistence.

## Connection Management
- Pool config: max 20 connections, 30s idle timeout, 5s connect timeout.
- The pool is exposed via `db.getPool()` for health checks and graceful shutdown.

## Testing Guidance
- Keep repository logic testable by injecting or abstracting the DB client.
- For integration tests, use `docker compose up db` to spin up an isolated Postgres instance.
