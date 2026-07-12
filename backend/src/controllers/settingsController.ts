import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS } from '../config/permissions';

const prisma = new PrismaClient();

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await prisma.depotSettings.findFirst();
    if (!settings) {
      settings = await prisma.depotSettings.create({
        data: { depotName: 'TransitOps Default', currency: 'USD', distanceUnit: 'km' }
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  const { depotName, currency, distanceUnit } = req.body;
  try {
    const settings = await prisma.depotSettings.findFirst();
    if (settings) {
      const updated = await prisma.depotSettings.update({
        where: { id: settings.id },
        data: { depotName, currency, distanceUnit }
      });
      res.json(updated);
    } else {
      res.status(404).json({ message: 'Settings not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPermissions = (req: Request, res: Response) => {
  res.json(PERMISSIONS);
};
