# ARDine AI Copilot Instructions (Index)

Use the scoped instructions below depending on which part of the repo you are modifying.

## Scopes

- Frontend (React UI, AR, features/components): `.github/instructions/frontend.md`
- Backend (controllers, AI orchestration, validation): `.github/instructions/backend.md`
- Database (repositories, db client, data model): `.github/instructions/database.md`
- Repo conventions + web security: `.github/instructions/repo-and-security.md`

## High-level Architecture

- UI calls the API layer in `src/shared/services/api.ts` (no ad-hoc `fetch` in components).
- Controllers live in `backend/` and use `backend/validators.ts` for input validation.
- Persistence is encapsulated in `database/repositories.ts` (controllers should not reach into `database/dbClient.ts`).
- Shared types and unions live in `src/shared/types.ts` (import via the `@/` alias).

## Development

```bash
npm install
# Put secrets (GEMINI_API_KEY/API_KEY) in .env.local for local development only

# Terminal 1: frontend
npm run dev

# Terminal 2: backend
npm run backend:dev
```

## Critical Security Note

Never ship secrets to the browser. Any AI calls requiring `GEMINI_API_KEY` should be done server-side.
