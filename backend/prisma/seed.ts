/**
 * Canonical seed for the integrated TransitOps platform.
 *
 * Source of truth: `seed-data.json` — the mock "collection" data (originally the
 * dashboard-and-analytics `db.json`). It is imported into MongoDB via Prisma.
 *
 * Reconciliation performed here:
 *  - numeric ids in the fixture are discarded; MongoDB generates ObjectIds and
 *    foreign keys are rewired through in-memory numericId -> ObjectId maps.
 *  - the legacy `DISPATCHER` role is renamed to the canonical `DRIVER`.
 *  - seed passwords are (re)hashed with bcrypt so Req 1.4 salt requirements hold.
 *
 * Run: `npm run seed` (from backend). Requires MONGODB_URI pointing at a replica set.
 */
import dotenv from 'dotenv';
import path from 'path';

// Load env before instantiating PrismaClient (schema reads MONGODB_URI at construction time).
dotenv.config({ path: path.join(__dirname, '../.env') });

import { PrismaClient, Role, VehicleStatus, DriverStatus, TripStatus, MaintenanceStatus, ExpenseType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

interface Fixture {
  users: any[];
  vehicles: any[];
  drivers: any[];
  trips: any[];
  maintenanceLogs: any[];
  fuelLogs: any[];
  expenses: any[];
  settings: any[];
}

const DEFAULT_PASSWORD = 'password123';

function normalizeRole(role: string): Role {
  // Reconcile legacy role name to the canonical requirements.md role set.
  if (role === 'DISPATCHER') return 'DRIVER';
  return role as Role;
}

async function clearDatabase() {
  // Order matters: delete children before parents to respect relations.
  await prisma.recoveryAudit.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.maintenanceLog.deleteMany({});
  await prisma.vehicleDocument.deleteMany({});
  await prisma.trip.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.driver.deleteMany({});
  await prisma.depotSettings.deleteMany({});
  await prisma.user.deleteMany({});
}

async function main() {
  const fixturePath = path.join(__dirname, 'seed-data.json');
  const fixture: Fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));

  await clearDatabase();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Users
  for (const u of fixture.users) {
    await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: normalizeRole(u.role),
        failedLoginAttempts: u.failedLoginAttempts ?? 0,
        lockedUntil: u.lockedUntil ? new Date(u.lockedUntil) : null,
      },
    });
  }

  // Vehicles — keep numericId -> ObjectId map for FK rewiring
  const vehicleIdMap = new Map<number, string>();
  for (const v of fixture.vehicles) {
    const created = await prisma.vehicle.create({
      data: {
        registrationNumber: v.registrationNumber,
        name: v.name,
        model: v.model ?? null,
        type: v.type,
        maxLoadCapacity: v.maxLoadCapacity,
        odometer: v.odometer,
        acquisitionCost: v.acquisitionCost,
        status: v.status as VehicleStatus,
        region: v.region,
      },
    });
    vehicleIdMap.set(v.id, created.id);
  }

  // Drivers
  const driverIdMap = new Map<number, string>();
  for (const d of fixture.drivers) {
    const created = await prisma.driver.create({
      data: {
        name: d.name,
        licenseNumber: d.licenseNumber,
        licenseCategory: d.licenseCategory,
        licenseExpiryDate: new Date(d.licenseExpiryDate),
        contactNumber: d.contactNumber,
        safetyScore: d.safetyScore,
        status: d.status as DriverStatus,
      },
    });
    driverIdMap.set(d.id, created.id);
  }

  // Trips
  const tripIdMap = new Map<number, string>();
  for (const t of fixture.trips) {
    const created = await prisma.trip.create({
      data: {
        source: t.source,
        sourceRegion: t.sourceRegion ?? null,
        destination: t.destination,
        destinationRegion: t.destinationRegion ?? null,
        cargoWeight: t.cargoWeight,
        plannedDistance: t.plannedDistance,
        actualDistance: t.actualDistance ?? null,
        fuelConsumed: t.fuelConsumed ?? null,
        revenue: t.revenue ?? null,
        status: t.status as TripStatus,
        dispatchedAt: t.dispatchedAt ? new Date(t.dispatchedAt) : null,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
        vehicleId: vehicleIdMap.get(t.vehicleId)!,
        driverId: driverIdMap.get(t.driverId)!,
      },
    });
    tripIdMap.set(t.id, created.id);
  }

  // Maintenance logs
  for (const m of fixture.maintenanceLogs) {
    await prisma.maintenanceLog.create({
      data: {
        description: m.description,
        cost: m.cost ?? null,
        status: m.status as MaintenanceStatus,
        startDate: new Date(m.startDate),
        endDate: m.endDate ? new Date(m.endDate) : null,
        vehicleId: vehicleIdMap.get(m.vehicleId)!,
      },
    });
  }

  // Fuel logs
  for (const f of fixture.fuelLogs) {
    await prisma.fuelLog.create({
      data: {
        liters: f.liters,
        cost: f.cost,
        date: new Date(f.date),
        vehicleId: vehicleIdMap.get(f.vehicleId)!,
        tripId: f.tripId != null ? tripIdMap.get(f.tripId) ?? null : null,
      },
    });
  }

  // Expenses
  for (const e of fixture.expenses) {
    await prisma.expense.create({
      data: {
        type: e.type as ExpenseType,
        amount: e.amount,
        description: e.description ?? null,
        date: new Date(e.date),
        vehicleId: vehicleIdMap.get(e.vehicleId)!,
      },
    });
  }

  // Depot settings (singleton)
  const s = fixture.settings[0];
  if (s) {
    await prisma.depotSettings.create({
      data: {
        depotName: s.depotName,
        currency: s.currency,
        distanceUnit: s.distanceUnit,
        fuelPrice: s.fuelPrice ?? 1.5,
        licenseReminderWindowDays: s.licenseReminderWindowDays ?? 30,
        emailRemindersEnabled: s.emailRemindersEnabled ?? false,
      },
    });
  }

  console.log(
    `Seed complete: ${fixture.users.length} users, ${fixture.vehicles.length} vehicles, ` +
    `${fixture.drivers.length} drivers, ${fixture.trips.length} trips, ` +
    `${fixture.fuelLogs.length} fuel logs, ${fixture.maintenanceLogs.length} maintenance logs.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
