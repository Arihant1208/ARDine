# AR-Dine: Interactive Menu & Ordering

An AI-powered AR menu experience for restaurants with separate views for customers and owners.

## 📁 Project Structure

```
ARDine/
├── src/                      # Frontend source code
│   ├── features/            # Feature-based modules
│   │   ├── auth/           # Authentication (Login/Signup)
│   │   ├── customer/       # Customer views (Menu, AR, Cart)
│   │   ├── owner/          # Owner dashboard (Orders, Menu Management)
│   │   └── landing/        # Landing page
│   ├── shared/             # Shared resources
│   │   ├── components/     # Reusable UI components
│   │   ├── layout/         # Layout components (Header, etc.)
│   │   ├── services/       # API clients
│   │   └── types.ts        # TypeScript types
│   ├── stores/             # Zustand state management
│   │   ├── useAuthStore.ts
│   │   ├── useCartStore.ts
│   │   └── useOwnerStore.ts
│   ├── App.tsx
│   └── main.tsx
├── backend/                 # Express backend
│   ├── db/                 # Database setup
│   ├── menuController.ts
│   ├── orderController.ts
│   └── server.ts
├── database/               # Data-access boundary
│   ├── dbClient.ts        # Demo/in-memory DB (Map-backed)
│   └── repositories.ts
└── index.html
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Gemini API key (only required for menu photo → AI analysis)
- (Optional) PostgreSQL connection string if you want to run `npm run db:setup`

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add:
   - `GEMINI_API_KEY` (or `API_KEY`) for backend AI calls
   - `CORS_ORIGIN` if your frontend is not on `http://localhost:3000`
   - `VITE_API_BASE_URL` only if you are not using the Vite dev proxy

3. **(Optional) Set up a Postgres schema:**
   ```bash
   npm run db:setup
   ```
   Note: the running app currently uses the demo/in-memory store in `database/dbClient.ts`. The `db:setup` script only applies SQL migrations; wiring runtime queries to Postgres is a separate step.

4. **Start development servers:**
   
   Terminal 1 (Frontend):
   ```bash
   npm run dev
   ```
   
   Terminal 2 (Backend):
   ```bash
   npm run backend:dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 🏗️ Architecture

### High-level flow

- The React SPA (Vite) calls the backend via `src/shared/services/api.ts`.
- The Express API in `backend/server.ts` routes requests to controllers.
- Controllers validate inputs (`backend/validators.ts`), orchestrate AI where needed, and persist via repositories (`database/repositories.ts`).
- Shared types live in `src/shared/types.ts` (imported via the `@/` alias).

### State Management (Zustand)

- **useAuthStore**: Manages user authentication and session
- **useCartStore**: Handles customer cart operations
- **useOwnerStore**: Manages owner dashboard data (menu, orders, config)

### Database Schema

- Runtime: demo/in-memory store in `database/dbClient.ts`.
- Migrations: optional SQL schema in `backend/db/schema.sql` runnable via `npm run db:setup`.

## 📦 Deployment

### Frontend (GitHub Pages)

This repo includes a GitHub Actions workflow that builds the Vite app and deploys `dist/` to GitHub Pages on pushes to `main`.

1. In GitHub, enable Pages for the repo:
   - **Settings → Pages → Build and deployment → Source: GitHub Actions**
2. Ensure your backend is deployed somewhere reachable via HTTPS.
3. Set `VITE_API_BASE_URL` to your backend origin for production builds.
   - Example: `https://your-backend.example.com`
   - Note: GitHub Pages cannot host the Express backend.

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm run backend:start`
5. Add environment variables:
   - `GEMINI_API_KEY` (or `API_KEY`)
   - `PORT=4000`
   - `CORS_ORIGIN`: Your frontend URL

### Database (Optional)

- If you only need the demo behavior, no external DB is required.
- If you want a Postgres schema ready for a real DB, set `DATABASE_URL` and run `npm run db:setup`.

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start frontend dev server
- `npm run backend:dev` - Start backend dev server
- `npm run typecheck` - Run TypeScript type checking
- `npm run build` - Build for production
- `npm run db:setup` - Initialize database schema

### Code Organization

- **Features are isolated**: Each feature (auth, customer, owner) has its own directory
- **Shared code is centralized**: Common components, types, and services are in `src/shared/`
- **State is managed globally**: Zustand stores provide global state management
- **Backend is modular**: Controllers handle business logic, repositories handle data access

## 🔑 Key Features

### For Customers
- Browse AR-enabled menu
- View 3D models of dishes
- Add items to cart
- Place orders with multiple payment methods

### For Owners
- Upload menu photos (AI generates dish data)
- Manage restaurant configuration
- View live orders dashboard
- Generate QR codes for tables

## 📝 Notes

- The current runtime DB behavior is demo/in-memory (Map-backed)
- AI-powered dish analysis uses Google Gemini
- 3D model generation is simulated (integrate with real 3D API for production)
- Authentication is basic (implement proper JWT/OAuth for production)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run typecheck` to verify
4. Submit a pull request

## 📄 License

MIT
