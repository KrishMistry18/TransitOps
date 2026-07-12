import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAvailableVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'AVAILABLE'
      }
    });
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch available vehicles' });
  }
};
