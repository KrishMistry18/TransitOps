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

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const where: any = {};
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { licenseNumber: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    const drivers = await prisma.driver.findMany({ where });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const getExpiringLicenses = async (req: Request, res: Response) => {
  try {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const drivers = await prisma.driver.findMany({
      where: {
        licenseExpiryDate: {
          lte: thirtyDaysFromNow
        },
        status: {
          not: 'SUSPENDED'
        }
      }
    });
    res.json(drivers);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch expiring licenses' });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.driver.findUnique({ where: { licenseNumber: req.body.licenseNumber } });
    if (existing) {
      return res.status(409).json({ message: 'License number already exists' });
    }
    const data = { ...req.body };
    if (data.licenseExpiryDate) {
      data.licenseExpiryDate = new Date(data.licenseExpiryDate);
    }
    const driver = await prisma.driver.create({ data });
    res.status(201).json(driver);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const data = { ...req.body };
    if (data.licenseExpiryDate) {
      data.licenseExpiryDate = new Date(data.licenseExpiryDate);
    }
    const driver = await prisma.driver.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const driver = await prisma.driver.update({
      where: { id: Number(req.params.id) },
      data: { status: 'SUSPENDED' }
    });
    res.json(driver);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to suspend driver' });
  }
};
