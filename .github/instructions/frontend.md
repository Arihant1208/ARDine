# Frontend (React + Vite) Instructions

## Scope
- Primary folders: `App.tsx`, `views/`, `components/`, `services/`, `types.ts`, `index.tsx`
- Frontend is a **single-page app** with manual view-state routing (no React Router).

## Architecture
- **Types**: Treat `types.ts` as the single source of truth for shared interfaces and enums.
- **API access**: All server/backend calls go through `services/api.ts` (no ad-hoc `fetch` in components).
- **Views vs components**:
  - `views/`: page-level orchestration, navigation state, high-level flows.
  - `components/`: reusable UI/feature components; keep them mostly presentational.

## State & Data Flow
- Keep cross-view state in `App.tsx` top-level state (per existing pattern).
- Prefer passing typed props downward; avoid hidden globals.
- Polling patterns:
  - Menu 3D generation: poll every 5s until `modelGenerationStatus === 'ready'`.
  - Owner order dashboard: poll every 3s.

## UI Conventions
- Use existing UI primitives:
  - `components/common/Button.tsx` (`variant`: `primary|secondary|ghost|dark|outline`, `size`: `sm|md|lg|xl`).
  - `components/common/Card.tsx` (`hoverable` when needed).
- Tailwind only; keep the established design language:
  - Rounded corners commonly use `rounded-[2.5rem]`.
  - Prefer existing spacing scale/classes used elsewhere.
- Keep components strongly typed: use `interface Props { ... }`.

## AR Viewer
- AR modal lifecycle must be resilient:
  - Ensure `model-viewer` setup/teardown is safe.
  - Prefer defensive checks around WebXR availability.

## Error Handling
- Surface user-safe messages in UI; avoid dumping raw errors.
- For async actions:
  - Use `isLoading`/`isProcessing` flags.
  - Reset state on navigation when it prevents stale UI.

## Web Security (Frontend)
- Never ship secrets to the browser.
  - Do **not** expose `GEMINI_API_KEY` via Vite `define` or `import.meta.env` in production builds.
  - Any AI calls requiring a secret key must be proxied through a server/controller.
- Avoid XSS by default:
  - Do not use `dangerouslySetInnerHTML`.
  - Treat all backend/AI strings as untrusted; render as text.
- Links:
  - When using `target="_blank"`, always include `rel="noreferrer noopener"`.

## When Changing UX
- Implement only what is requested.
- Avoid adding new pages or flows unless explicitly specified.
