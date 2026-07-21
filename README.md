<div align="center">

# 🚛 TransitOps

**Logistics & Fleet Command Surface**

[![Live Demo](https://img.shields.io/badge/🔗_Live_Demo-transitops.vercel.app-0070f3?style=for-the-badge)](https://transit-ops-mu-liard.vercel.app)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*TransitOps is a real-time fleet management, driver operations, and dispatch intelligence platform built for modern logistics teams.*

</div>

---

## ✨ What It Does

TransitOps is a comprehensive logistics dashboard that pulls together fleet tracking, driver operations, and dispatch management into a single real-time interface:

- **Fleet Register** — Track vehicle assets, model specifications, region assignment, load capacity, and lifecycle status.
- **Driver Operations** — Manage driver registries, license categories, expiry tracking, and safety scores.
- **Dispatch & Trip Management** — Plan and monitor trip lifecycles from draft to completion, tracking origin/destination, cargo weight, and revenue.
- **Fuel Intelligence** — Record fuel logs, monitor efficiency, calculate costs, and flag anomalies automatically.
- **Maintenance Logs** — Track scheduled service events, repair descriptions, and cost records.
- **Analytics & Audit** — Real-time performance dashboards and complete audit logging for configuration changes.
- **Role-Based Access Control** — Gated write operations and new registration approval workflow managed directly by Admins.
- **Data Import & Export** — Bulk CSV import with validation and one-click CSV/PDF export.

---

## 🛠️ Tech Stack Used

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Routing | TanStack Router |
| State/Data Fetching | TanStack Query |
| Styling | Tailwind CSS v4 + Shadcn UI |
| Database | Firebase Realtime Database (RTDB) |
| Authentication | Firebase Auth |
| Charts | Recharts |
| Reports | jsPDF, PapaParse |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Firebase](https://firebase.google.com) project (RTDB and Auth enabled)

### 1. Clone & Install

```bash
git clone https://github.com/KrishMistry18/TransitOps.git
cd TransitOps
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your keys from `.env.example` (Firebase config).

### 3. Run Dev Server

```bash
npm run dev
# Open http://localhost:5173
```

### 4. Seed Initial Data (Optional)

You can run these scripts to create a default admin and seed the database with mock operational records:

```bash
node setup-admin.mjs
node seed-data.mjs
```

---

## 📁 Project Structure

```text
src/
├── components/       # Reusable UI components (Shadcn UI)
├── hooks/            # Custom React hooks
├── integrations/     # Third-party integrations
├── lib/              # Utility functions and Firebase config
├── routes/           # TanStack Router page components
├── styles.css        # Global Tailwind CSS
├── router.tsx        # Router configuration
└── start.ts          # App entry point
```

---

## ⚙️ Vercel Deployment

TransitOps is optimized out-of-the-box for seamless deployment on **Vercel** with Nitro auto-detect.

1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import the `TransitOps` GitHub repository.
4. Add your Firebase `VITE_FIREBASE_*` keys in the Environment Variables section.
5. Click **Deploy**. Vercel will automatically build the `.vercel/output` and launch your application instantly.

---

## 📄 License

MIT © [Krish Mistry](https://github.com/KrishMistry18)
