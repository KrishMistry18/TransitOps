import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const { vehicleId, description, cost, date } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: Number(vehicleId) } });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'ON_TRIP') {
      return res.status(400).json({ message: 'Cannot service a vehicle currently on a trip' });
    }
    
    // Check if it already has an ACTIVE maintenance record
    const activeLog = await prisma.maintenanceLog.findFirst({
      where: {
        vehicleId: Number(vehicleId),
        status: 'ACTIVE'
      }
    });

    if (activeLog) {
      return res.status(400).json({ message: 'Vehicle is already in shop' });
    }

    const transaction = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId: Number(vehicleId),
          description,
          cost: Number(cost),
          startDate: new Date(date),
          status: 'ACTIVE'
        }
      }),
      prisma.vehicle.update({
        where: { id: Number(vehicleId) },
        data: { status: 'IN_SHOP' }
      })
    ]);

    res.status(201).json({ log: transaction[0], vehicle: transaction[1] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
};

export const closeMaintenanceLog = async (req: Request, res: Response) => {
  try {
    const logId = Number(req.params.id);
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: logId },
      include: { vehicle: true }
    });

    if (!log) {
      return res.status(404).json({ message: 'Maintenance log not found' });
    }
    
    if (log.status === 'CLOSED') {
      return res.status(400).json({ message: 'Maintenance log already closed' });
    }

    const updates: any[] = [
      prisma.maintenanceLog.update({
        where: { id: logId },
        data: {
          status: 'CLOSED',
          endDate: new Date()
        }
      })
    ];

    if (log.vehicle.status !== 'RETIRED') {
      updates.push(
        prisma.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: 'AVAILABLE' }
        })
      );
    }

    const transaction = await prisma.$transaction(updates);

    res.json({
      log: transaction[0],
      vehicle: transaction.length > 1 ? transaction[1] : log.vehicle
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to close maintenance log' });
  }
};

export const getMaintenanceLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: { vehicle: true },
      orderBy: { startDate: 'desc' }
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
};
