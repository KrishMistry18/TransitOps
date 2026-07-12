import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkFuelAnomaly } from '../services/fuelAnamoly.service';

const prisma = new PrismaClient();

export async function createFuelLog(req: Request, res: Response) {
  const vehicleId = req.body.vehicleId;
  const tripId = req.body.tripId || null;
  const liters = Number(req.body.liters);
  const cost = Number(req.body.cost);
  const date = req.body.date;
  const distance = req.body.distance != null ? Number(req.body.distance) : null;

  if (!vehicleId) {
    return res.status(400).json({ success: false, message: 'vehicleId is required' });
  }
  if (!Number.isFinite(liters) || liters <= 0) {
    return res.status(400).json({ success: false, message: 'Fuel quantity must be greater than zero' }); // Req 9.2
  }
  if (!Number.isFinite(cost) || cost < 0) {
    return res.status(400).json({ success: false, message: 'Cost cannot be negative' }); // Req 9.5
  }
  if (distance !== null && (!Number.isFinite(distance) || distance <= 0)) {
    return res.status(400).json({ success: false, message: 'distance must be > 0 when provided' });
  }

  // Validate the FK before writing — prevents orphaned fuel logs that later crash reads.
  const vehicle = await prisma.vehicle.findUnique({ where: { id: String(vehicleId) } });
  if (!vehicle) {
    return res.status(404).json({ success: false, message: 'Vehicle not found' });
  }
  if (tripId) {
    const trip = await prisma.trip.findUnique({ where: { id: String(tripId) } });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
  }

  let anomaly = { efficiency: 0, flagged: false, baseline: undefined, reason: undefined } as any;
  if (distance !== null) {
    anomaly = await checkFuelAnomaly(vehicleId, distance, liters, cost);
  }

  const log = await prisma.fuelLog.create({
    data: {
      vehicleId,
      tripId,
      liters,
      cost,
      date: date ? new Date(date) : new Date(),
      impliedEfficiency: distance !== null ? anomaly.efficiency : null,
      anomalyFlag: anomaly.flagged,
      anomalyReason: anomaly.reason,
    },
  });

  return res.status(201).json({ success: true, data: log, anomaly });
}

export async function listFuelLogs(req: Request, res: Response) {
  try {
    const vehicleId = req.query.vehicleId ? String(req.query.vehicleId) : undefined;
    const flaggedOnly = req.query.flaggedOnly === 'true';

    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    if (flaggedOnly) where.anomalyFlag = true;

    // Fetch logs and vehicles separately and join manually. Using Prisma's `include`
    // on this required relation throws if any log references a deleted/missing
    // vehicle (data drift) — this degrades gracefully instead of 500ing the page.
    const logs = await prisma.fuelLog.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: [...new Set(logs.map((l) => l.vehicleId))] } },
      select: { id: true, name: true, registrationNumber: true },
    });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));

    const result = logs.map((l) => ({ ...l, vehicle: vehicleById.get(l.vehicleId) ?? null }));
    return res.json(result);
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch fuel logs' });
  }
}

export async function listFlaggedFuelLogs(_req: Request, res: Response) {
  try {
    const logs = await prisma.fuelLog.findMany({ where: { anomalyFlag: true }, orderBy: { date: 'desc' } });
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: [...new Set(logs.map((l) => l.vehicleId))] } },
    });
    const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
    const result = logs.map((l) => ({ ...l, vehicle: vehicleById.get(l.vehicleId) ?? null }));
    return res.json({ success: true, data: result });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch flagged fuel logs' });
  }
}

export async function getFuelStats(_req: Request, res: Response) {
  try {
    const allLogs = await prisma.fuelLog.findMany();

    const totalLogs = allLogs.length;
    const flaggedCount = allLogs.filter(l => l.anomalyFlag).length;
    const totalSpend = allLogs.reduce((sum, l) => sum + (l.cost || 0), 0);

    const withEfficiency = allLogs.filter(l => l.impliedEfficiency != null && l.impliedEfficiency > 0);
    const avgEfficiency = withEfficiency.length > 0
      ? withEfficiency.reduce((sum, l) => sum + (l.impliedEfficiency ?? 0), 0) / withEfficiency.length
      : 0;

    return res.json({
      totalLogs,
      flaggedCount,
      avgEfficiency: Math.round(avgEfficiency * 10) / 10,
      totalSpend,
    });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to fetch fuel stats' });
  }
}
