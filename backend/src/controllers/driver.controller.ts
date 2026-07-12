import { Request, Response } from 'express';
import { PrismaClient, Prisma, DriverStatus } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_STATUSES: DriverStatus[] = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

// GET /api/drivers/available — AVAILABLE + non-expired license (dispatch pool, Req 6.4)
export const getAvailableDrivers = async (_req: Request, res: Response) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { status: 'AVAILABLE', licenseExpiryDate: { gt: new Date() } },
    });
    res.json(drivers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch available drivers' });
  }
};

// GET /api/drivers — list with status filter + case-insensitive search (Req 14.2)
export const getDrivers = async (req: Request, res: Response) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const where: Prisma.DriverWhereInput = {};
    if (status) where.status = status as DriverStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const drivers = await prisma.driver.findMany({ where, orderBy: { name: 'asc' } });
    res.json(drivers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

// GET /api/drivers/expiring-licenses — within configured window, ordered by expiry asc (Req 18.1)
export const getExpiringLicenses = async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.depotSettings.findFirst();
    const windowDays = settings?.licenseReminderWindowDays ?? 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + windowDays);

    const drivers = await prisma.driver.findMany({
      where: { licenseExpiryDate: { lte: cutoff }, status: { not: 'SUSPENDED' } },
      orderBy: { licenseExpiryDate: 'asc' },
    });
    res.json(drivers);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expiring licenses' });
  }
};

// POST /api/drivers — create (Req 5.1, 5.2)
export const createDriver = async (req: Request, res: Response) => {
  try {
    const { name, licenseNumber, licenseCategory, contactNumber } = req.body;
    const safetyScore = req.body.safetyScore != null ? Number(req.body.safetyScore) : 100;

    if (!Number.isFinite(safetyScore) || safetyScore < 0 || safetyScore > 100) {
      return res.status(400).json({ message: 'Safety score must be between 0 and 100' });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        licenseNumber,
        licenseCategory,
        contactNumber,
        safetyScore,
        licenseExpiryDate: new Date(req.body.licenseExpiryDate),
        status: 'AVAILABLE',
      },
    });
    res.status(201).json(driver);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'License number already exists' });
    }
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

// PUT /api/drivers/:id — update editable attributes (Req 5.3, 5.4)
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const data: Prisma.DriverUpdateInput = {};
    const b = req.body;

    if (b.name !== undefined) data.name = b.name;
    if (b.licenseNumber !== undefined) data.licenseNumber = b.licenseNumber;
    if (b.licenseCategory !== undefined) data.licenseCategory = b.licenseCategory;
    if (b.contactNumber !== undefined) data.contactNumber = b.contactNumber;
    if (b.licenseExpiryDate !== undefined) data.licenseExpiryDate = new Date(b.licenseExpiryDate);
    if (b.safetyScore !== undefined) {
      const v = Number(b.safetyScore);
      if (!Number.isFinite(v) || v < 0 || v > 100) return res.status(400).json({ message: 'Safety score must be between 0 and 100' });
      data.safetyScore = v;
    }
    if (b.status !== undefined) {
      if (!VALID_STATUSES.includes(b.status)) return res.status(400).json({ message: 'Invalid driver status' });
      data.status = b.status;
    }

    const driver = await prisma.driver.update({ where: { id }, data });
    res.json(driver);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

// DELETE /api/drivers/:id — suspend (retain record)
export const suspendDriver = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const driver = await prisma.driver.update({ where: { id }, data: { status: 'SUSPENDED' } });
    res.json(driver);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Driver not found' });
    }
    res.status(500).json({ error: 'Failed to suspend driver' });
  }
};
