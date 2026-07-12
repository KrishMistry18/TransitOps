# TransitOps (Hackathon Skeleton)

This is the monorepo for TransitOps, containing both the frontend (React/Vite) and backend (Express/Prisma) applications. 
It includes a fully functioning authentication system with role-based access control (RBAC), and stubbed endpoints for all other features so the team can work in parallel.

## Prerequisites
- Node.js 18+
- Local MongoDB instance (or use MongoDB Atlas)

## Getting Started

1. **Database Setup**
   Ensure MongoDB is running locally on port 27017 or update `backend/.env` with your own MongoDB Atlas connection string.
   > **Note:** MongoDB transactions require a replica set (Atlas satisfies this automatically).

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

3. **Database Seeding (Backend)**
   Currently, we do not have an automated Mongoose seed script, but the controllers will create default settings on first load. Mongoose handles schema creation dynamically.

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

## Design System (Frontend)

To keep the TransitOps application looking consistent, we have implemented a shared design system based on `design.md`. **Do not use arbitrary hex codes or create new UI components unless absolutely necessary.**

### Core Components (`@/components/ui`)
All teammates should use the following exported components:
- **Button**: Handles variants (`primary`, `secondary`, `danger`, `ghost`) and sizes.
- **Card**: Standard rounded, bordered container. Pass `accent="#hex"` to add a top colored border for specific modules.
- **KPICard**: Pre-built widget for dashboard metrics with `Trend` arrows.
- **StatusChip**: **CRITICAL**. Use this for all statuses. It accepts a `status` prop and maps it to the correct color (Available/Pending/In Shop/Danger). Never build a one-off colored badge.
- **Table**: Modular table wrapper with `TableHeader`, `TableRow`, etc. Use `TableCell mono` for ID columns.
- **Input & Select**: Styled form fields with proper focus states.
- **Modal**: Pre-styled dialog wrapper with backdrop and escape-key handling.

### Styling Conventions
- **Colors**: Use Tailwind theme colors (`bg-bg`, `text-primary`, `bg-surface`, `border-border`).
- **Typography**: `font-display` (Space Grotesk) for headings/KPIs, `font-mono` (JetBrains Mono) for data, and `font-body` (Inter) for everything else.

## Code Ownership & Status

To avoid merge conflicts during the hackathon, please stick to your assigned domains:

### Fully Implemented (Do not modify unless you are Lead)
- **Shared Types**: `shared/types.ts` is the single source of truth for all data shapes in the app. Use the `@shared/*` alias when importing.
- **Design System**: `frontend/src/components/ui/*` and `frontend/tailwind.config.ts`.
- **Auth & Settings**: `backend/src/controllers/authController.ts`, `settingsController.ts`, `frontend/src/pages/Login.tsx`, `Settings.tsx`.
- **App Shell & Layout**: `frontend/src/components/Sidebar.tsx`, `Topbar.tsx`, `ProtectedRoute.tsx`.
- **Database Schema**: `backend/src/models/*` (Mongoose Schemas).

### Stubbed (Replace with real logic)
- **Feature Pages**: `frontend/src/pages/Dashboard.tsx`, `Fleet.tsx`, `Drivers.tsx`, `Trips.tsx`, `Maintenance.tsx`, `Fuel.tsx`, `Analytics.tsx`.
- **API Controllers**: `backend/src/controllers/stubsController.ts`. Move your routes into dedicated controllers (e.g. `tripsController.ts`) as you build them. All mock data here is strongly typed against `@shared/types`.
