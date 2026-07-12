# Person 4 — Dashboard & Reports/Analytics

**Role:** Frontend-heavy, backend is read-only aggregation. You are the
**last** module in the dependency chain — most of your real endpoints need
Vehicle/Driver/Trip/Fuel/Maintenance data to exist first. This works in your
favor: build 100% of your UI against mocks for the first several hours, and
only wire real aggregation queries once Persons 2 & 3 have data flowing
(around Hour 4–5).

Read `00_INTEGRATION_AND_CONTRACT.md` sections 2, 3 before starting.

---

## Your Folders (only you edit these)
```
/frontend/src/app/dashboard
/frontend/src/app/analytics
/frontend/src/components/analytics/*
/backend/src/analytics/*
/backend/src/dashboard/*
```

**Never touch:** `schema.prisma`, `/shared/types.ts`, `/shared/rbac.ts`,
`/vehicles`, `/drivers`, `/trips`, `/maintenance`, `/fuel-expenses`, `/auth`.
You only **read** from other modules' tables via Prisma queries in your own
`/backend/src/analytics` and `/backend/src/dashboard` files — never write.

**Wait for:** Person 1's Phase 0 push for mocks. You are the biggest
beneficiary of good mock data since your whole UI is data-visualization —
push Person 1 early for realistic mock KPI numbers if they're not ready by
Hour 1, or just hand-write `/shared/mocks/dashboard-kpis.mock.json` yourself
(new file, not editing someone else's).

---

## Phase 1 (Hour 0.5–1): Mock-driven UI first

Since you're blocked on real data the longest, front-load ALL your UI work
against static mocks so you're not idle waiting on Persons 2/3:

- Create `/shared/mocks/dashboard-kpis.mock.json`,
  `/shared/mocks/analytics.mock.json` yourself with realistic numbers
  matching the mockup screens (Active Vehicles: 53, Available: 42, In
  Maintenance: 5, Active Trips: 18, Pending: 9, Drivers On Duty: 26, Fleet
  Utilization: 81%, Fuel Efficiency: 8.4 km/l, Operational Cost: 34,070,
  Vehicle ROI: 14.2%).

---

## Phase 2 (Hour 1–4): Dashboard page (mockup screen 1)

Build entirely against mocks in this phase.

- Filter bar: Vehicle Type, Status, Region (dropdowns — wire to Person 1's
  `/depots` for region once available, static list is fine before then)
- 7 KPI cards in a row: Active Vehicles, Available Vehicles, Vehicles in
  Maintenance, Active Trips, Pending Trips, Drivers on Duty, Fleet
  Utilization % — build a reusable `<KpiCard>` component (put it in your own
  `/components/analytics` even though conceptually shared, to avoid touching
  Person 1's `/components/shared` folder — small duplication is fine here,
  not worth a merge conflict over one component)
- "Recent Trips" table: Trip, Vehicle, Driver, Status (colored badge),
  ETA — matches mockup's TR001-TR006 example rows
- "Vehicle Status" horizontal bar chart: Available/On Trip/In Shop/Retired
  proportions (Recharts `<BarChart>` or simple styled divs, mockup shows
  simple horizontal bars — doesn't need to be fancy)

---

## Phase 3 (Hour 4–6): Wire real dashboard data

Once Person 2 (vehicles/drivers) and Person 3 (trips) have working endpoints:

**Backend (`/backend/src/dashboard`):**
- `GET /dashboard/kpis` — aggregation queries:
  - `activeVehicles` = count where status != RETIRED
  - `availableVehicles` = count where status == AVAILABLE
  - `inMaintenance` = count where status == IN_SHOP
  - `activeTrips` = count where status == DISPATCHED
  - `pendingTrips` = count where status == DRAFT
  - `driversOnDuty` = count Driver where status == ON_TRIP (or ON_TRIP +
    AVAILABLE depending on how your team defines "on duty" — confirm
    quickly with the group, doesn't need a long discussion)
  - `fleetUtilizationPct` = `(vehicles with status ON_TRIP) / (total
    non-retired vehicles) * 100`
- Swap your dashboard's fetch calls from mock JSON to this real endpoint.

---

## Phase 4 (Hour 5–7): Reports & Analytics page (mockup screen 7)

**Backend (`/backend/src/analytics`):**
- `GET /analytics/fuel-efficiency` — per vehicle: `sum(actualDistanceKm
  across completed trips) / sum(fuelConsumedL from FuelLog)`. Also return a
  fleet-wide average for the headline KPI card.
- `GET /analytics/roi` — per vehicle:
  `(sum(trip.revenue) - (sum(maintenanceLog.cost) + sum(fuelLog.cost))) /
  vehicle.acquisitionCost`. This is a read-only cross-module query — you're
  allowed to read Trip/MaintenanceLog/FuelLog tables, just never write to
  them.
- `GET /analytics/monthly-revenue` — group completed trips' `revenue` by
  month, for the bar chart.
- `GET /analytics/top-costliest-vehicles` — vehicles ranked by
  `fuelTotal + maintenanceTotal` descending, top 3-5.
- `GET /analytics/export.csv` — flatten trips (or whichever entity makes
  sense) into CSV, set `Content-Type: text/csv` header. Use a small library
  like `json2csv` or hand-roll it, it's a simple task.

**Frontend:**
- 4 KPI cards: Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle
  ROI
- ROI formula caption text under the cards (mockup shows this as a small
  gray line — nice touch, easy to add)
- Monthly Revenue bar chart (Recharts)
- "Top Costliest Vehicles" horizontal bar list
- "Export CSV" button wired to the export endpoint (trigger file download)
- PDF export: **skip** — explicitly marked optional in the original doc,
  don't spend time on it unless everything else is done early

---

## Phase 5 (Hour 7–8): Polish + integration support

- Double check every KPI number on the dashboard actually changes correctly
  when you dispatch/complete a trip live (best final-demo moment — do a full
  walkthrough: create trip → dispatch → watch dashboard active trips count
  go up).
- Cross-check ROI and fuel efficiency numbers make sense with the seeded demo
  data (sanity check, not perfection — just make sure nothing shows
  `NaN`/`Infinity` from divide-by-zero on a vehicle with no trips yet; guard
  those cases with a fallback `—` display).

---

## Definition of Done
- [ ] Dashboard renders all 7 KPIs from real aggregation (not mock) by end
- [ ] Recent Trips + Vehicle Status widgets reflect live data
- [ ] Analytics page shows fuel efficiency, ROI, operational cost, fleet
      utilization
- [ ] Monthly revenue chart and top-costliest-vehicles list render
- [ ] CSV export works
- [ ] No NaN/Infinity crashes on edge-case (zero-trip) vehicles
- [ ] RBAC wrapper applied (Financial Analyst + Fleet Manager get edit/view
      per matrix; Dispatcher gets none on analytics)
