import { PrismaClient, DisruptionType, Trip } from '@prisma/client';
import { validateAssignment } from './tripValidation.service';

const prisma = new PrismaClient();

const AT_RISK_MESSAGE = 'No eligible replacement available — trip is at risk';

export interface RecoveryCandidate {
  vehicleId: string;
  driverId: string;
  vehicleRegistration: string;
  driverName: string;
  recoveryScore: number;
  reasons: {
    capacityMargin: number;      // Req 22.6 — maxLoadCapacity − cargoWeight
    regionMatch: 'same region' | 'different region';
    safetyScore: number;
  };
}

/**
 * Req 22.1–22.3 — report a disruption, flag affected DISPATCHED trips, and take the
 * disrupted asset out of service atomically.
 */
export async function reportDisruption(
  type: DisruptionType,
  targetId: string
): Promise<{ ok: boolean; message?: string; disruptedTrips: Trip[] }> {
  const isVehicleEvent = type === 'VEHICLE_BREAKDOWN' || type === 'EMERGENCY_MAINTENANCE';

  return prisma.$transaction(async (tx) => {
    if (isVehicleEvent) {
      const vehicle = await tx.vehicle.findUnique({ where: { id: targetId } });
      if (!vehicle) return { ok: false, message: 'Vehicle not found', disruptedTrips: [] };

      const trips = await tx.trip.findMany({ where: { vehicleId: targetId, status: 'DISPATCHED' } });
      await tx.trip.updateMany({ where: { vehicleId: targetId, status: 'DISPATCHED' }, data: { disrupted: true } });
      // Req 22.3 — take the vehicle out of service.
      await tx.vehicle.update({ where: { id: targetId }, data: { status: 'IN_SHOP' } });

      const disruptedTrips = await tx.trip.findMany({ where: { id: { in: trips.map((t) => t.id) } } });
      return { ok: true, disruptedTrips };
    } else {
      const driver = await tx.driver.findUnique({ where: { id: targetId } });
      if (!driver) return { ok: false, message: 'Driver not found', disruptedTrips: [] };

      const trips = await tx.trip.findMany({ where: { driverId: targetId, status: 'DISPATCHED' } });
      await tx.trip.updateMany({ where: { driverId: targetId, status: 'DISPATCHED' }, data: { disrupted: true } });
      // Req 22.3 — take the driver out of service.
      await tx.driver.update({ where: { id: targetId }, data: { status: 'OFF_DUTY' } });

      const disruptedTrips = await tx.trip.findMany({ where: { id: { in: trips.map((t) => t.id) } } });
      return { ok: true, disruptedTrips };
    }
  });
}

/**
 * Req 22.4–22.6, 22.9 — produce ranked Replacement_Candidate pairs for a disrupted trip.
 * Marks the trip At_Risk when no candidate exists.
 */
export async function getCandidates(
  tripId: string
): Promise<{ ok: boolean; message?: string; atRisk?: boolean; candidates: RecoveryCandidate[]; trip?: Trip }> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return { ok: false, message: 'Trip not found', candidates: [] };

  const now = new Date();
  const [vehicles, drivers] = await Promise.all([
    // Eligible vehicles: AVAILABLE + capacity >= cargo (Req 22.4)
    prisma.vehicle.findMany({ where: { status: 'AVAILABLE', maxLoadCapacity: { gte: trip.cargoWeight } } }),
    // Eligible drivers: AVAILABLE + license not expired (Req 22.4)
    prisma.driver.findMany({ where: { status: 'AVAILABLE', licenseExpiryDate: { gte: now } } }),
  ]);

  const candidates: RecoveryCandidate[] = [];
  for (const v of vehicles) {
    const sameRegion = !!trip.sourceRegion && v.region === trip.sourceRegion;
    const regionScore = sameRegion ? 100 : 0;                                   // Req 22.5(a)
    const withinCapacity = v.maxLoadCapacity <= trip.cargoWeight * 1.5;         // Req 22.5(c)
    const capacityScore = withinCapacity ? 50 : 0;
    for (const d of drivers) {
      const recoveryScore = regionScore + d.safetyScore + capacityScore;        // Req 22.5(b)
      candidates.push({
        vehicleId: v.id,
        driverId: d.id,
        vehicleRegistration: v.registrationNumber,
        driverName: d.name,
        recoveryScore,
        reasons: {
          capacityMargin: v.maxLoadCapacity - trip.cargoWeight,
          regionMatch: sameRegion ? 'same region' : 'different region',
          safetyScore: d.safetyScore,
        },
      });
    }
  }

  if (candidates.length === 0) {
    // Req 22.9 — mark At_Risk.
    await prisma.trip.update({ where: { id: tripId }, data: { atRisk: true } });
    return { ok: true, atRisk: true, message: AT_RISK_MESSAGE, candidates: [], trip };
  }

  // Req 22.5 — order by score desc; tie-break by candidate vehicle odometer asc.
  const odometerById = new Map(vehicles.map((v) => [v.id, v.odometer]));
  candidates.sort((a, b) => {
    if (b.recoveryScore !== a.recoveryScore) return b.recoveryScore - a.recoveryScore;
    return (odometerById.get(a.vehicleId) ?? 0) - (odometerById.get(b.vehicleId) ?? 0);
  });

  return { ok: true, candidates: candidates.slice(0, 25), trip };
}

/**
 * Req 22.7, 22.8, 22.10 — execute a one-click reassignment with re-validation, atomic
 * status changes, and an audit record.
 */
export async function reassign(
  tripId: string,
  candidateVehicleId: string,
  candidateDriverId: string,
  disruptionType?: DisruptionType
): Promise<{ ok: boolean; code?: number; message?: string; trip?: Trip }> {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return { ok: false, code: 404, message: 'Trip not found' };
  if (trip.status !== 'DISPATCHED') {
    return { ok: false, code: 409, message: 'Only a dispatched trip can be recovered' };
  }

  // Req 22.8 — re-run the same eligibility validation used by dispatch.
  const validation = await validateAssignment(candidateVehicleId, candidateDriverId, trip.cargoWeight);
  if (!validation.ok) {
    return { ok: false, code: 409, message: validation.message };
  }

  const originalVehicleId = trip.vehicleId;
  const originalDriverId = trip.driverId;

  // Infer disruption type for the audit if not supplied.
  let auditType: DisruptionType = disruptionType ?? 'VEHICLE_BREAKDOWN';
  if (!disruptionType) {
    const origDriver = await prisma.driver.findUnique({ where: { id: originalDriverId } });
    if (origDriver?.status === 'OFF_DUTY') auditType = 'DRIVER_UNAVAILABLE';
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Release the original non-disrupted asset if it is still ON_TRIP.
      if (originalVehicleId !== candidateVehicleId) {
        const ov = await tx.vehicle.findUnique({ where: { id: originalVehicleId } });
        if (ov?.status === 'ON_TRIP') await tx.vehicle.update({ where: { id: originalVehicleId }, data: { status: 'AVAILABLE' } });
      }
      if (originalDriverId !== candidateDriverId) {
        const od = await tx.driver.findUnique({ where: { id: originalDriverId } });
        if (od?.status === 'ON_TRIP') await tx.driver.update({ where: { id: originalDriverId }, data: { status: 'AVAILABLE' } });
      }

      // Lock the replacement pair (race-guarded).
      const vLock = await tx.vehicle.updateMany({ where: { id: candidateVehicleId, status: 'AVAILABLE' }, data: { status: 'ON_TRIP' } });
      if (vLock.count === 0) throw new Error('VEHICLE_RACE');
      const dLock = await tx.driver.updateMany({ where: { id: candidateDriverId, status: 'AVAILABLE' }, data: { status: 'ON_TRIP' } });
      if (dLock.count === 0) throw new Error('DRIVER_RACE');

      // Reassign; keep DISPATCHED; clear flags (Req 22.7).
      const t = await tx.trip.update({
        where: { id: tripId },
        data: { vehicleId: candidateVehicleId, driverId: candidateDriverId, status: 'DISPATCHED', disrupted: false, atRisk: false },
      });

      // Req 22.10 — audit record.
      await tx.recoveryAudit.create({
        data: {
          tripId,
          originalVehicleId,
          originalDriverId,
          replacementVehicleId: candidateVehicleId,
          replacementDriverId: candidateDriverId,
          disruptionType: auditType,
        },
      });

      return t;
    });
    return { ok: true, trip: updated };
  } catch {
    return { ok: false, code: 409, message: 'Replacement was just taken by another operation — please retry' };
  }
}
