import { PrismaClient, Vehicle, Driver } from '@prisma/client';

const prisma = new PrismaClient();

export interface IneligibleVehicle extends Vehicle { reasons: string[]; }
export interface IneligibleDriver extends Driver { reasons: string[]; }

export interface EligibilityResult {
  eligibleVehicles: Vehicle[];
  ineligibleVehicles: IneligibleVehicle[];
  eligibleDrivers: Driver[];
  ineligibleDrivers: IneligibleDriver[];
  capacityWarning: string | null;   // set when a selected vehicle can't carry the cargo (Req 16.3)
  eligibleForDispatch: boolean | null; // Req 16.4 — only computed when vehicle+driver+cargo provided
}

/**
 * Compute dispatch eligibility for the composing UI (Req 6.2–6.6, 16).
 * - Vehicles selectable only if AVAILABLE (Req 6.2/6.3; IN_SHOP covers open maintenance per Req 8.3).
 * - Drivers selectable only if AVAILABLE and license not expired (Req 6.4–6.6).
 * Optionally evaluates a specific vehicle/driver + cargo to produce a dispatch-readiness verdict.
 */
export async function getEligibility(opts: {
  cargoWeight?: number;
  vehicleId?: string;
  driverId?: string;
}): Promise<EligibilityResult> {
  const now = new Date();
  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { registrationNumber: 'asc' } }),
    prisma.driver.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const eligibleVehicles: Vehicle[] = [];
  const ineligibleVehicles: IneligibleVehicle[] = [];
  for (const v of vehicles) {
    const reasons: string[] = [];
    if (v.status !== 'AVAILABLE') reasons.push(`Status is ${v.status}`);
    if (opts.cargoWeight != null && opts.cargoWeight > v.maxLoadCapacity) {
      reasons.push(`Capacity ${v.maxLoadCapacity}kg is below cargo ${opts.cargoWeight}kg`);
    }
    if (reasons.length === 0) eligibleVehicles.push(v);
    else ineligibleVehicles.push({ ...v, reasons });
  }

  const eligibleDrivers: Driver[] = [];
  const ineligibleDrivers: IneligibleDriver[] = [];
  for (const d of drivers) {
    const reasons: string[] = [];
    if (d.status !== 'AVAILABLE') reasons.push(`Status is ${d.status}`);
    if (new Date(d.licenseExpiryDate) < now) reasons.push('License expired');
    if (reasons.length === 0) eligibleDrivers.push(d);
    else ineligibleDrivers.push({ ...d, reasons });
  }

  // Capacity warning + dispatch-readiness for a specific selection (Req 16.3/16.4)
  let capacityWarning: string | null = null;
  let eligibleForDispatch: boolean | null = null;
  if (opts.vehicleId && opts.driverId && opts.cargoWeight != null) {
    const v = vehicles.find((x) => x.id === opts.vehicleId);
    const d = drivers.find((x) => x.id === opts.driverId);
    const vOk = !!v && v.status === 'AVAILABLE' && opts.cargoWeight <= v.maxLoadCapacity;
    const dOk = !!d && d.status === 'AVAILABLE' && new Date(d.licenseExpiryDate) >= now;
    if (v && opts.cargoWeight > v.maxLoadCapacity) {
      capacityWarning = 'Cargo weight exceeds vehicle maximum load capacity';
    }
    eligibleForDispatch = vOk && dOk;
  }

  return { eligibleVehicles, ineligibleVehicles, eligibleDrivers, ineligibleDrivers, capacityWarning, eligibleForDispatch };
}
