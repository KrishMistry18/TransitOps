import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAvailableDrivers = async (req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'AVAILABLE',
        licenseExpiryDate: {
          gt: new Date()
        }
      }
    });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
};
