import { PrismaClient } from '@prisma/client';
import { ValidationResult } from '../types/trip.types';

const prisma = new PrismaClient();

/**
 * Validate that a vehicle + driver + cargo are eligible for dispatch.
 * Uses the exact requirement messages (Req 6.7–6.10). Reused by the recovery
 * engine (Req 22.8) so the same eligibility rules apply on reassignment.
 * Does NOT check trip status — the caller owns the state-transition rules.
 */
export async function validateAssignment(
  vehicleId: string,
  driverId: string,
  cargoWeight: number
): Promise<ValidationResult> {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return { ok: false, errorCode: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' };
  }
  if (vehicle.status !== 'AVAILABLE') {
    return { ok: false, errorCode: 'VEHICLE_UNAVAILABLE', message: 'Selected vehicle is not available' }; // Req 6.8
  }

  const driver = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!driver) {
    return { ok: false, errorCode: 'DRIVER_NOT_FOUND', message: 'Driver not found' };
  }
  if (driver.status !== 'AVAILABLE') {
    return { ok: false, errorCode: 'DRIVER_UNAVAILABLE', message: 'Selected driver is not available' }; // Req 6.9
  }
  if (new Date(driver.licenseExpiryDate) < new Date()) {
    return { ok: false, errorCode: 'LICENSE_EXPIRED', message: "Selected driver's license has expired" }; // Req 6.10
  }

  if (cargoWeight > vehicle.maxLoadCapacity) {
    return {
      ok: false,
      errorCode: 'CARGO_EXCEEDS_CAPACITY',
      message: 'Cargo weight exceeds vehicle maximum load capacity', // Req 6.7
      details: { cargoWeight, maxCapacity: vehicle.maxLoadCapacity },
    };
  }

  return { ok: true };
}

export function validateCompletion(body: {
  actualDistance?: number;
  fuelConsumed?: number;
}): ValidationResult {
  if (
    body.actualDistance == null || !Number.isFinite(body.actualDistance) ||
    body.fuelConsumed == null || !Number.isFinite(body.fuelConsumed)
  ) {
    return {
      ok: false,
      errorCode: 'MISSING_COMPLETION_DATA',
      message: 'actualDistance and fuelConsumed are required to complete a trip',
    };
  }
  return { ok: true };
}
