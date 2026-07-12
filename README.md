# TransitOps (Hackathon Skeleton)

This is the monorepo for TransitOps, containing both the frontend (React/Vite) and backend (Express/Prisma) applications. 
It includes a fully functioning authentication system with role-based access control (RBAC), and stubbed endpoints for all other features so the team can work in parallel.

## Prerequisites
- Node.js 18+
- Local PostgreSQL instance (or use the provided docker-compose)

## Getting Started

1. **Database Setup**
   Ensure PostgreSQL is running. If using Docker, run:
   ```bash
   docker compose up -d
   ```
   (Alternatively, update `backend/.env` with your own PostgreSQL connection string)

2. **Install Dependencies**
   From the root directory:
   ```bash
   npm install --workspaces
   ```
   Wait, if `--workspaces` throws errors on Windows due to npm versions, just run:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Database Migration and Seeding (Backend)**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run prisma seed
   ```

4. **Run the App**
   From the root directory (starts both frontend and backend concurrently if you set up concurrent scripts, or run them in separate terminals):
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Demo Logins

The database is seeded with 4 default users, one for each role. The password for all accounts is `password123`.

| Role | Email |
| :--- | :--- |
| Fleet Manager | `fleet@transitops.com` |
| Dispatcher | `dispatcher@transitops.com` |
| Safety Officer | `safety@transitops.com` |
| Financial Analyst | `finance@transitops.com` |

> Note: The account will lock for 15 minutes after 5 failed login attempts.

## Code Ownership & Status

To avoid merge conflicts during the hackathon, please stick to your assigned domains:

### Fully Implemented (Do not modify unless you are Lead)
- **Auth & Settings**: `backend/src/controllers/authController.js`, `settingsController.js`, `frontend/src/pages/Login.jsx`, `Settings.jsx`.
- **App Shell & Layout**: `frontend/src/components/Sidebar.jsx`, `ProtectedRoute.jsx`.
- **Database Schema**: `backend/prisma/schema.prisma` (Contact Lead if you need schema changes).

### Stubbed (Replace with real logic)
- **Feature Pages**: `frontend/src/pages/Dashboard.jsx`, `Fleet.jsx`, `Drivers.jsx`, `Trips.jsx`, `Maintenance.jsx`, `Fuel.jsx`, `Analytics.jsx`.
- **API Controllers**: `backend/src/controllers/stubsController.js`. Move your routes into dedicated controllers (e.g. `tripsController.js`) as you build them.
