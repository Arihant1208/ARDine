# ARDine AI Copilot Instructions

## Project Overview

**ARDine** is a React + Vite web app combining AI-powered 3D menu digitization with AR visualization. It enables restaurant owners to upload dish photos for automatic 3D model generation and allows customers to browse menus in AR with real-time ordering.

**Key Tech Stack:**

- Frontend: React 19, TypeScript, Tailwind CSS
- Backend Controllers: Node.js TypeScript services
- AI: Google Gemini 3-Flash (image analysis → 3D geometry prompts)
- Storage: In-memory singleton `PostgresClient` (development—mock data)
- AR: `model-viewer` web component (WebXR, QuickLook, SceneViewer)

## Architecture & Data Flow

### Core User Journeys

1. **Owner → Menu Upload**: Upload dish photo → Gemini analyzes → generates `geometricPrompt` → simulated 3D pipeline → GLB model ready
2. **Owner → Dashboard**: Real-time order polling (3s interval) → update order status (received → preparing → served → paid)
3. **Customer → AR Browse**: QR/URL with `?u=userId&table=tableNumber` → fetch menu → click dish → AR viewer modal
4. **Customer → Order**: Select items → choose table → pick payment method → submit → order placed

### Key Service Boundaries

- **[backend/menuController.ts](backend/menuController.ts)**: Menu image → AI analysis → async 3D generation tracking
- **[backend/orderController.ts](backend/orderController.ts)**: Order creation & status management
- **[services/api.ts](services/api.ts)**: Single centralized API layer (auth, menu, orders, config)
- **[database/repositories.ts](database/repositories.ts)**: CRUD abstraction for Menu, Order, Config, Auth

### Data Model Notes

- `ModelGenerationStatus`: `'pending' | 'generating' | 'ready' | 'failed'`—tracks async 3D processing
- `Order.status`: `'received' | 'preparing' | 'served' | 'paid'`—owner updates via dashboard
- `ViewState`: routing state (no React Router)—manually managed in [App.tsx](App.tsx) top-level state
- URL parameters enable owner-agnostic customer views: `?u=userId&table=tableNumber`

## Development Workflows

### Local Setup

```bash
npm install
# Set GEMINI_API_KEY in .env.local
npm run dev  # Port 3000, auto-reload
```

### Build & Preview

```bash
npm run build  # Outputs dist/
npm run preview
```

### Key Environment

- `process.env.GEMINI_API_KEY` injected via Vite's `define` in [vite.config.ts](vite.config.ts)
- AI client uses factory pattern in [backend/aiClient.ts](backend/aiClient.ts)—always fresh API key

## Code Conventions & Patterns

### Component Structure

- **Layout Components** ([components/layout/](components/layout/)): Header, page structure
- **Common UI** ([components/common/](components/common/)): Reusable Button, Card with consistent styling
- **Feature-Specific**: owner/, customer/, ui/ subdirectories separate domain logic
- **Props Typing**: All components strongly typed with `interface ComponentProps`
- **Styling**: Tailwind only—rounded corners use `rounded-[2.5rem]` pattern, orange accent color throughout

### Button/Card Patterns

```tsx
// Button variants: 'primary' | 'secondary' | 'ghost' | 'dark' | 'outline'
// Sizes: 'sm' | 'md' | 'lg' | 'xl'
<Button variant="primary" size="lg" isLoading={loading}>Upload</Button>

// Card: hoverable=true enables hover state
<Card hoverable className="additional-styles">{children}</Card>
```

### Backend Services

- **Validators**: Input validation before DB operations (image format, order completeness)—see [backend/validators.ts](backend/validators.ts)
- **Repository Pattern**: All DB operations go through `MenuRepository`, `OrderRepository`, `ConfigRepository`, `AuthRepository`
- **AI Integration**: Gemini response strictly typed with `responseSchema` for predictable JSON extraction

### Async UI Patterns

- **3D Generation**: `modelGenerationStatus` polled every 5s until `'ready'` (see [App.tsx](App.tsx#L65-L72))
- **Order Dashboard**: Polling interval is 3s for live updates (see [App.tsx](App.tsx#L92-L97))
- **Menu Upload**: Async background pipeline simulated with delays; `isProcessing` + `statusMessage` show progress

## Critical Files Reference

- **[App.tsx](App.tsx)**: Entry point—state management, navigation, API orchestration
- **[types.ts](types.ts)**: Single source of truth for all TypeScript interfaces
- **[services/api.ts](services/api.ts)**: All external API calls routed here (use `ApiService.*`)
- **[backend/menuController.ts](backend/menuController.ts)**: Image → AI → 3D pipeline orchestration
- **[database/dbClient.ts](database/dbClient.ts)**: Singleton DB mock (seed demo users & dishes)
- **[components/ARViewer.tsx](components/ARViewer.tsx)**: AR modal—handles model-viewer lifecycle & controls

## Common Tasks

### Add a New Owner Feature

1. Add `ViewState` variant in [types.ts](types.ts)
2. Create view component in [views/](views/)
3. Add state & navigation logic in [App.tsx](App.tsx)
4. Call `ApiService.*` for backend operations

### Extend the Menu Pipeline

1. Update `Dish` interface in [types.ts](types.ts) if adding fields
2. Modify AI prompt in [backend/menuController.ts](backend/menuController.ts#L25-L29)
3. Update `responseSchema` to match new fields
4. Adjust UI rendering in menu components

### Modify Order Status Flow

- Update `OrderStatus` type in [types.ts](types.ts)
- Add new status logic in [backend/orderController.ts](backend/orderController.ts)
- Update dashboard UI in [components/owner/OrderCard.tsx](components/owner/OrderCard.tsx)

## Notes for AI Agents

- **No Next.js/routing library**: Manual view state management in App.tsx top-level state
- **Demo data seeded**: Login uses hard-coded credentials (`demo@ardine.com` / `password123`)
- **3D models are simulated**: Production would use Sketchfab API or similar for actual GLB generation
- **Tailwind classes**: Use existing spacing scale (rounded-[2.5rem], shadow-xl, etc.) for consistency
- **TypeScript strict mode**: Expect full type coverage—no `any` types in new code
- **Color scheme**: Orange (`orange-500`) primary, grays for secondary, white/black for contrast
