import { Request, Response } from 'express';
import { PrismaClient, TripStatus } from '@prisma/client';
import { validateAssignment, validateCompletion } from '../services/tripValidation.service';
import { getEligibility } from '../services/dispatchEligibility.service';
import { checkFuelAnomaly } from '../services/fuelAnamoly.service';

const prisma = new PrismaClient();

export async function createTrip(req: Request, res: Response) {
  try {
    const { source, destination, sourceRegion, destinationRegion, vehicleId, driverId } = req.body;
    const cargoWeight = Number(req.body.cargoWeight);
    const plannedDistance = Number(req.body.plannedDistance);

    if (!vehicleId || !driverId) {
      return res.status(400).json({ success: false, message: 'vehicleId and driverId are required' });
    }
    if (!Number.isFinite(cargoWeight) || cargoWeight <= 0 || !Number.isFinite(plannedDistance) || plannedDistance <= 0) {
      return res.status(400).json({ success: false, message: 'cargoWeight and plannedDistance must be positive numbers' });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: String(vehicleId) } });
    if (!vehicle) {
      return res.status(404).json({ success: false, errorCode: 'VEHICLE_NOT_FOUND', message: 'Vehicle not found' });
    }
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        success: false,
        errorCode: 'CARGO_EXCEEDS_CAPACITY',
        message: 'Cargo weight exceeds vehicle maximum load capacity', // Req 6.7
      });
    }

    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        sourceRegion: sourceRegion ?? vehicle.region ?? null,
        destinationRegion: destinationRegion ?? null,
        vehicleId: String(vehicleId),
        driverId: String(driverId),
        cargoWeight,
        plannedDistance,
        status: 'DRAFT', // Req 6.1
      },
    });
    return res.status(201).json({ success: true, data: trip });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to create trip' });
  }
}

export async function listTrips(req: Request, res: Response) {
  const statusRaw = req.query.status;
  let status: TripStatus | undefined;

  if (typeof statusRaw === 'string') {
    const normalized = statusRaw.toUpperCase() as TripStatus;
    const allowed: TripStatus[] = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
    if (!allowed.includes(normalized)) {
      return res.status(400).json({ success: false, message: 'Invalid status filter' });
    }
    status = normalized;
  }

  const trips = await prisma.trip.findMany({
    where: status ? { status } : undefined,
    include: { vehicle: true, driver: true },
    orderBy: { dispatchedAt: 'desc' },
  });
  // Raw array — the frontend consumes list endpoints as arrays.
  return res.json(trips);
}

export async function getTrip(req: Request, res: Response) {
  const tripId = String(req.params.id);
  const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { vehicle: true, driver: true } });
  if (!trip) return res.status(404).json({ success: false, message: 'Trip not found' });
  return res.json({ success: true, data: trip });
}

// GET /api/trips/eligibility — eligible/ineligible lists + reasons (Req 6.2–6.6, 16)
export async function getTripEligibility(req: Request, res: Response) {
  const cargoWeight = req.query.cargoWeight != null ? Number(req.query.cargoWeight) : undefined;
  const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;
  const driverId = req.query.driverId ? String(req.query.driverId) : undefined;
  const result = await getEligibility({ cargoWeight, vehicleId, driverId });
  return res.json({ success: true, data: result });
}

// GET /api/trips/estimate — trip fuel-cost + margin estimate (Req 17)
export async function estimateTrip(req: Request, res: Response) {
  try {
    const vehicleId = String(req.query.vehicleId ?? '');
    const plannedDistance = Number(req.query.plannedDistance);
    const revenue = req.query.revenue != null ? Number(req.query.revenue) : null;

    if (!vehicleId || !Number.isFinite(plannedDistance) || plannedDistance <= 0) {
      return res.status(400).json({ success: false, message: 'vehicleId and positive plannedDistance are required' });
    }

    const [vehicle, settings, fuelAgg, tripAgg] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.depotSettings.findFirst(),
      prisma.fuelLog.aggregate({ where: { vehicleId }, _sum: { liters: true } }),
      prisma.trip.aggregate({ where: { vehicleId, status: 'COMPLETED' }, _sum: { actualDistance: true } }),
    ]);

    if (!vehicle) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const fuelPrice = settings?.fuelPrice ?? 1.5;
    const totalLiters = fuelAgg._sum.liters ?? 0;
    const totalDistance = tripAgg._sum.actualDistance ?? 0;

    // Efficiency N/A when no fuel history (Req 17.2 / 10.2)
    const efficiency = totalLiters > 0 ? totalDistance / totalLiters : null;

    let estimatedFuelCost: number | 'N/A';
    if (efficiency === null || efficiency <= 0) {
      estimatedFuelCost = 'N/A';
    } else {
      const litersNeeded = plannedDistance / efficiency;
      estimatedFuelCost = Number((litersNeeded * fuelPrice).toFixed(2));
    }

    // Margin = revenue − estimated fuel cost (Req 17.3)
    let estimatedMargin: number | 'N/A' = 'N/A';
    if (revenue != null && Number.isFinite(revenue) && estimatedFuelCost !== 'N/A') {
      estimatedMargin = Number((revenue - estimatedFuelCost).toFixed(2));
    }

    return res.json({
      success: true,
      data: {
        vehicleId,
        fuelEfficiency: efficiency === null ? 'N/A' : Number(efficiency.toFixed(2)),
        fuelPrice,
        plannedDistance,
        estimatedFuelCost,
        revenue,
        estimatedMargin,
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to estimate trip' });
  }
}

// POST /api/trips/:id/dispatch — Draft→Dispatched and Completed→Dispatched (Req 7.2/7.3/7.4/7.12)
export async function dispatchTrip(req: Request, res: Response) {
  const tripId = String(req.params.id);
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ success: false, errorCode: 'TRIP_NOT_FOUND', message: 'Trip not found' });

  // Only DRAFT or COMPLETED may transition to DISPATCHED (Req 7.11/7.12)
  if (trip.status !== 'DRAFT' && trip.status !== 'COMPLETED') {
    return res.status(409).json({ success: false, errorCode: 'INVALID_TRANSITION', message: 'Invalid trip status transition' });
  }

  const validation = await validateAssignment(trip.vehicleId, trip.driverId, trip.cargoWeight);
  if (!validation.ok) {
    return res.status(409).json({ success: false, errorCode: validation.errorCode, message: validation.message, details: validation.details });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Conditional locks guard against a race with another dispatch (Req 11.4 atomicity).
      const vLock = await tx.vehicle.updateMany({ where: { id: trip.vehicleId, status: 'AVAILABLE' }, data: { status: 'ON_TRIP' } });
      if (vLock.count === 0) throw new Error('VEHICLE_RACE');
      const dLock = await tx.driver.updateMany({ where: { id: trip.driverId, status: 'AVAILABLE' }, data: { status: 'ON_TRIP' } });
      if (dLock.count === 0) throw new Error('DRIVER_RACE');

      return tx.trip.update({
        where: { id: tripId },
        data: { status: 'DISPATCHED', dispatchedAt: new Date(), disrupted: false, atRisk: false },
      });
    });
    return res.json({ success: true, data: updated });
  } catch (e) {
    const msg = e instanceof Error && e.message === 'DRIVER_RACE'
      ? 'Driver was just taken by another trip — please retry'
      : 'Vehicle was just taken by another trip — please retry';
    return res.status(409).json({ success: false, errorCode: 'RACE_CONDITION', message: msg });
  }
}

// POST /api/trips/:id/complete — Dispatched→Completed (Req 7.5–7.8)
export async function completeTrip(req: Request, res: Response) {
  const tripId = String(req.params.id);

  const actualDistance = Number(req.body.actualDistance);
  const fuelConsumed = Number(req.body.fuelConsumed);
  const fuelCost = req.body.fuelCost != null ? Number(req.body.fuelCost) : null;
  // Final odometer reading (Req 7.5/7.8); fall back to odometer + actualDistance if not provided.
  const finalOdometer = req.body.finalOdometer != null ? Number(req.body.finalOdometer)
    : (req.body.odometer != null ? Number(req.body.odometer) : null);

  const bodyCheck = validateCompletion({ actualDistance, fuelConsumed });
  if (!bodyCheck.ok) {
    return res.status(400).json({ success: false, errorCode: bodyCheck.errorCode, message: bodyCheck.message });
  }

  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ success: false, errorCode: 'TRIP_NOT_FOUND', message: 'Trip not found' });
  if (trip.status !== 'DISPATCHED') {
    return res.status(409).json({ success: false, errorCode: 'INVALID_TRANSITION', message: 'Invalid trip status transition' }); // Req 7.11
  }

  const anomaly = fuelConsumed > 0 ? await checkFuelAnomaly(trip.vehicleId, actualDistance, fuelConsumed) : null;

  const result = await prisma.$transaction(async (tx) => {
    const vehicle = await tx.vehicle.findUnique({ where: { id: trip.vehicleId } });
    const newOdometer = finalOdometer != null && Number.isFinite(finalOdometer)
      ? finalOdometer
      : (vehicle ? vehicle.odometer + actualDistance : undefined);

    // Vehicle → AVAILABLE + odometer update (Req 7.6/7.8); driver → AVAILABLE (Req 7.7)
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: 'AVAILABLE', ...(newOdometer != null ? { odometer: newOdometer } : {}) },
    });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } });

    const updated = await tx.trip.update({
      where: { id: tripId },
      data: { status: 'COMPLETED', completedAt: new Date(), actualDistance, fuelConsumed },
    });

    let fuelLog = null;
    if (fuelCost != null && Number.isFinite(fuelCost)) {
      fuelLog = await tx.fuelLog.create({
        data: {
          vehicleId: trip.vehicleId,
          tripId: trip.id,
          liters: fuelConsumed,
          cost: fuelCost,
          date: new Date(),
          impliedEfficiency: anomaly?.efficiency ?? null,
          anomalyFlag: anomaly?.flagged ?? false,
          anomalyReason: anomaly?.reason ?? null,
        },
      });
    }
    return { trip: updated, fuelLog };
  });

  return res.json({ success: true, data: result });
}

// POST /api/trips/:id/cancel — Draft→Cancelled (no status change) / Dispatched→Cancelled (release) (Req 7.9/7.10)
export async function cancelTrip(req: Request, res: Response) {
  const tripId = String(req.params.id);
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) return res.status(404).json({ success: false, errorCode: 'TRIP_NOT_FOUND', message: 'Trip not found' });

  if (trip.status === 'DRAFT') {
    const updated = await prisma.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
    return res.json({ success: true, data: updated });
  }

  if (trip.status !== 'DISPATCHED') {
    return res.status(409).json({ success: false, errorCode: 'INVALID_TRANSITION', message: 'Invalid trip status transition' }); // Req 7.11
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } });
    return tx.trip.update({ where: { id: tripId }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
  });
  return res.json({ success: true, data: updated });
}
