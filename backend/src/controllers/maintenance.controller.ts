import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/maintenance — list logs with vehicle registration (Req 8.7)
export const getMaintenanceLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: { vehicle: { select: { registrationNumber: true, name: true } } },
      orderBy: { startDate: 'desc' },
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
};

// POST /api/maintenance — create log, set vehicle IN_SHOP (Req 8.1, 8.2), guard on-trip (Req 8.4)
export const createMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const { vehicleId, description } = req.body;
    const cost = req.body.cost != null ? Number(req.body.cost) : null;
    const date = req.body.date ? new Date(req.body.date) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findUnique({ where: { id: String(vehicleId) } });
      if (!vehicle) return { error: { code: 404, message: 'Vehicle not found' } };
      if (vehicle.status === 'ON_TRIP') {
        return { error: { code: 400, message: 'Cannot start maintenance on a vehicle that is on a trip' } };
      }

      const existingOpen = await tx.maintenanceLog.findFirst({
        where: { vehicleId: vehicle.id, status: 'ACTIVE' },
      });
      if (existingOpen) return { error: { code: 400, message: 'Vehicle already has an open maintenance log' } };

      const log = await tx.maintenanceLog.create({
        data: { vehicleId: vehicle.id, description, cost, startDate: date, status: 'ACTIVE' },
      });
      // Persist status change atomically with the log (Req 11.4). Retired vehicles keep their status.
      if (vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'IN_SHOP' } });
      }
      return { log };
    });

    if ('error' in result && result.error) {
      return res.status(result.error.code).json({ message: result.error.message });
    }
    res.status(201).json(result.log);
  } catch {
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
};

// POST /api/maintenance/:id/close — close log, restore vehicle to AVAILABLE unless RETIRED (Req 8.5, 8.6)
export const closeMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findUnique({ where: { id } });
      if (!log) return { error: { code: 404, message: 'Maintenance log not found' } };
      if (log.status === 'CLOSED') return { error: { code: 400, message: 'Maintenance log already closed' } };

      const updated = await tx.maintenanceLog.update({
        where: { id },
        data: { status: 'CLOSED', endDate: new Date() },
      });

      const vehicle = await tx.vehicle.findUnique({ where: { id: log.vehicleId } });
      if (vehicle && vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({ where: { id: vehicle.id }, data: { status: 'AVAILABLE' } });
      }
      return { log: updated };
    });

    if ('error' in result && result.error) {
      return res.status(result.error.code).json({ message: result.error.message });
    }
    res.json(result.log);
  } catch {
    res.status(500).json({ error: 'Failed to close maintenance log' });
  }
};
