# ARDine AI Copilot Instructions (Index)

Use the scoped instructions below depending on which part of the repo you are modifying.

## Scopes

- Frontend (React UI, AR, views/components): `.github/instructions/frontend.md`
- Backend (controllers, AI orchestration, validation): `.github/instructions/backend.md`
- Database (repositories, db client, data model): `.github/instructions/database.md`
- Repo conventions + web security: `.github/instructions/repo-and-security.md`

## High-level Architecture

- UI calls the API layer in `services/api.ts`.
- Controllers live in `backend/` and use `backend/validators.ts` for input validation.
- Persistence is encapsulated in `database/repositories.ts`.
- Shared types and unions live in `types.ts`.

## Development

```bash
npm install
# Set GEMINI_API_KEY in .env.local for local development only
npm run dev
```

## Critical Security Note

Never ship secrets to the browser. Any AI calls requiring `GEMINI_API_KEY` should be done server-side.
