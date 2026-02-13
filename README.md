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
├── database/               # Database client
│   ├── dbClient.ts        # PostgreSQL client
│   └── repositories.ts
└── index.html
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- Gemini API key

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
   - Your Gemini API key
   - Your Supabase database URL (replace `[YOUR-PASSWORD]`)

3. **Set up the database:**
   ```bash
   npm run db:setup
   ```

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

### State Management (Zustand)

- **useAuthStore**: Manages user authentication and session
- **useCartStore**: Handles customer cart operations
- **useOwnerStore**: Manages owner dashboard data (menu, orders, config)

### Database Schema

- **users**: User accounts (owners)
- **restaurant_configs**: Restaurant settings
- **dishes**: Menu items with AR models
- **orders**: Customer orders
- **order_items**: Order line items

## 📦 Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `VITE_API_BASE_URL`: Your backend URL
4. Deploy

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm run backend:start`
5. Add environment variables:
   - `DATABASE_URL`
   - `GEMINI_API_KEY`
   - `PORT=4000`
   - `CORS_ORIGIN`: Your frontend URL

### Database (Supabase)

1. Create a Supabase project
2. Copy the connection string
3. Run migrations: `npm run db:setup`

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

- The current implementation uses a PostgreSQL database
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
