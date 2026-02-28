# Frontend (React + Vite) Instructions

## Scope
- Primary folders: `src/App.tsx`, `src/main.tsx`, `src/features/`, `src/shared/`, `src/stores/`
- Frontend is a **single-page app** with client-side routing via **React Router** (`react-router-dom`).

## Architecture
- **Routing**: All routes are defined in `src/main.tsx` using `BrowserRouter`. Route tree:
  - `/` → LandingView
  - `/auth` → AuthView (Google OAuth + demo login)
  - `/menu/:userId` → CustomerMenuView (QR code target)
  - `/menu/:userId/cart` → CustomerCartView (checkout)
  - `/owner/*` → guarded by `OwnerGuard` (redirects to `/auth` if not logged in)
    - `/owner/setup` → OwnerSetupView
    - `/owner/dashboard` → OwnerDashboardView
- **Types**: Treat `src/shared/types.ts` as the single source of truth for shared interfaces and enums.
- **API access**: All server/backend calls go through `src/shared/services/api.ts` (no ad-hoc `fetch` in components). The API client injects JWT auth headers automatically.
- **Auth**: Google OAuth via `@react-oauth/google` (`GoogleOAuthProvider` wraps the app in `main.tsx`). JWT tokens stored in localStorage.
- **Payments**: Stripe via `@stripe/stripe-js` for card/UPI payments. Cash payments skip Stripe.
- **Views vs components**:
  - `src/features/**`: feature modules (auth, landing, customer, owner) containing view components and feature widgets.
  - `src/shared/**`: reusable UI primitives, layout, and cross-cutting helpers.

## State & Data Flow
- **Zustand stores** (`src/stores/`) manage all global state:
  - `useAuthStore`: Google OAuth login, session restore from localStorage, logout.
  - `useCartStore`: Cart items, customer info (name/phone), payment method, checkout step.
  - `useOwnerStore`: Menu dishes, restaurant config, orders.
  - `useToastStore`: Toast notifications.
- Prefer reading from stores over passing props through many layers.
- `App.tsx` is a thin shell: session restore on mount + `<Outlet />` + `<Toast />`.
- Polling patterns:
  - Menu 3D generation: poll every 5s until `modelGenerationStatus === 'ready'`.
  - Owner order dashboard: poll every 3s.

## UI Conventions
- Use existing UI primitives:
  - `src/shared/components/ui/Button.tsx` (use existing `variant`/`size` options).
  - `src/shared/components/ui/Card.tsx`.
  - `src/shared/components/ui/Badge.tsx`.
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
  - Do **not** expose `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, or `JWT_SECRET` via Vite.
  - Only `VITE_GOOGLE_CLIENT_ID` and `VITE_STRIPE_PUBLISHABLE_KEY` are safe for the frontend bundle.
- Avoid XSS by default:
  - Do not use `dangerouslySetInnerHTML`.
  - Treat all backend/AI strings as untrusted; render as text.
- Links:
  - When using `target="_blank"`, always include `rel="noreferrer noopener"`.

## When Changing UX
- Implement only what is requested.
- Avoid adding new pages or flows unless explicitly specified.
