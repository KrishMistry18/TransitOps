import { Request, Response } from 'express';
import { PrismaClient, Prisma, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/dashboard — count KPIs + fleet utilization (Req 3).
// Filters: type, status, region combined with AND (Req 3.9/3.10).
// Each KPI is computed independently; a failure isolates to that KPI (Req 3.13).
export const getDashboard = async (req: Request, res: Response) => {
  const type = req.query.type ? String(req.query.type) : undefined;
  const status = req.query.status ? String(req.query.status) : undefined;
  const region = req.query.region ? String(req.query.region) : undefined;

  const vehicleFilter: Prisma.VehicleWhereInput = {};
  if (type) vehicleFilter.type = type;
  if (status) vehicleFilter.status = status as VehicleStatus;
  if (region) vehicleFilter.region = region;

  // Resolve the set of vehicle ids matching the filter to scope trip counts.
  let vehicleIds: string[] | null = null;
  if (type || status || region) {
    const filtered = await prisma.vehicle.findMany({ where: vehicleFilter, select: { id: true } });
    vehicleIds = filtered.map((v) => v.id);
  }
  const tripVehicleScope = vehicleIds ? { vehicleId: { in: vehicleIds } } : {};

  const countVehicles = (extra: Prisma.VehicleWhereInput) =>
    prisma.vehicle.count({ where: { ...vehicleFilter, ...extra } });
  const countTrips = (extra: Prisma.TripWhereInput) =>
    prisma.trip.count({ where: { ...tripVehicleScope, ...extra } });

  const results = await Promise.allSettled([
    countVehicles({ status: 'ON_TRIP' }),                    // 0 Active Vehicles
    countVehicles({ status: 'AVAILABLE' }),                  // 1 Available Vehicles
    countVehicles({ status: 'IN_SHOP' }),                    // 2 Vehicles in Maintenance
    countTrips({ status: 'DISPATCHED' }),                    // 3 Active Trips
    countTrips({ status: 'DRAFT' }),                         // 4 Pending Trips
    prisma.driver.count({ where: { status: 'ON_TRIP' } }),   // 5 Drivers On Duty
    countVehicles({ status: { not: 'RETIRED' } }),           // 6 total non-retired
    prisma.trip.count({ where: { atRisk: true, status: 'DISPATCHED' } }), // 7 at-risk (Req 22.11)
  ]);

  const val = (i: number): number | null =>
    results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<number>).value : null;

  const UNAVAILABLE = 'unavailable';
  const kpi = (i: number): number | string => {
    const v = val(i);
    return v === null ? UNAVAILABLE : v;
  };

  const activeVehicles = val(0);
  const totalNonRetired = val(6);
  let fleetUtilization: string;
  if (activeVehicles === null || totalNonRetired === null) {
    fleetUtilization = UNAVAILABLE;
  } else if (totalNonRetired === 0) {
    fleetUtilization = '0.0%'; // Req 3.8
  } else {
    fleetUtilization = `${((activeVehicles / totalNonRetired) * 100).toFixed(1)}%`; // Req 3.7
  }

  // Recovered-today count (Req 22.11) — audit rows created since midnight.
  let recoveredToday: number | string = UNAVAILABLE;
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    recoveredToday = await prisma.recoveryAudit.count({ where: { timestamp: { gte: start } } });
  } catch {
    recoveredToday = UNAVAILABLE;
  }

  res.json({
    activeVehicles: kpi(0),
    availableVehicles: kpi(1),
    vehiclesInMaintenance: kpi(2),
    activeTrips: kpi(3),
    pendingTrips: kpi(4),
    driversOnDuty: kpi(5),
    fleetUtilization,
    atRiskTrips: kpi(7),
    recoveredToday,
  });
};
