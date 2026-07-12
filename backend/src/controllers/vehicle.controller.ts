import { Request, Response } from 'express';
import { PrismaClient, Prisma, VehicleStatus } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_STATUSES: VehicleStatus[] = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

// GET /api/vehicles/available — only AVAILABLE vehicles (dispatch pool)
export const getAvailableVehicles = async (_req: Request, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch available vehicles' });
  }
};

// GET /api/vehicles — list with optional type/status filter + case-insensitive search (Req 14.1)
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const type = req.query.type ? String(req.query.type) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;

    const where: Prisma.VehicleWhereInput = {};
    if (type) where.type = type;
    if (status) where.status = status as VehicleStatus;
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { registrationNumber: 'asc' } });
    res.json(vehicles);
  } catch {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// POST /api/vehicles — create with Req 4.1–4.5 validation + exact messages
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const { registrationNumber, name, model, type } = req.body;
    const maxLoadCapacity = Number(req.body.maxLoadCapacity);
    const odometer = req.body.odometer != null ? Number(req.body.odometer) : 0;
    const acquisitionCost = Number(req.body.acquisitionCost);
    const region = req.body.region ?? '';

    if (maxLoadCapacity <= 0 || !Number.isFinite(maxLoadCapacity)) {
      return res.status(400).json({ message: 'Maximum load capacity must be greater than zero' });
    }
    if (odometer < 0 || !Number.isFinite(odometer)) {
      return res.status(400).json({ message: 'Odometer cannot be negative' });
    }
    if (acquisitionCost <= 0 || !Number.isFinite(acquisitionCost)) {
      return res.status(400).json({ message: 'Acquisition cost must be greater than zero' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        registrationNumber,
        name,
        model: model ?? null,
        type,
        maxLoadCapacity,
        odometer,
        acquisitionCost,
        region,
        status: 'AVAILABLE',
      },
    });
    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Unique constraint on registrationNumber (Req 4.2)
      return res.status(409).json({ message: 'Registration number already exists' });
    }
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

// PUT /api/vehicles/:id — update editable attributes (Req 4.6/4.7/4.8)
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const data: Prisma.VehicleUpdateInput = {};
    const b = req.body;

    if (b.name !== undefined) data.name = b.name;
    if (b.model !== undefined) data.model = b.model;
    if (b.type !== undefined) data.type = b.type;
    if (b.region !== undefined) data.region = b.region;
    if (b.maxLoadCapacity !== undefined) {
      const v = Number(b.maxLoadCapacity);
      if (v <= 0 || !Number.isFinite(v)) return res.status(400).json({ message: 'Maximum load capacity must be greater than zero' });
      data.maxLoadCapacity = v;
    }
    if (b.odometer !== undefined) {
      const v = Number(b.odometer);
      if (v < 0 || !Number.isFinite(v)) return res.status(400).json({ message: 'Odometer cannot be negative' });
      data.odometer = v;
    }
    if (b.acquisitionCost !== undefined) {
      const v = Number(b.acquisitionCost);
      if (v <= 0 || !Number.isFinite(v)) return res.status(400).json({ message: 'Acquisition cost must be greater than zero' });
      data.acquisitionCost = v;
    }
    if (b.status !== undefined) {
      if (!VALID_STATUSES.includes(b.status)) return res.status(400).json({ message: 'Invalid vehicle status' });
      data.status = b.status;
    }

    const vehicle = await prisma.vehicle.update({ where: { id }, data });
    res.json(vehicle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

// DELETE /api/vehicles/:id — retire (retain record, Req 4.7)
export const retireVehicle = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const vehicle = await prisma.vehicle.update({ where: { id }, data: { status: 'RETIRED' } });
    res.json(vehicle);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(500).json({ error: 'Failed to retire vehicle' });
  }
};

// ---- Vehicle documents (Req 20) ----

// GET /api/vehicles/:id/documents — list documents for a vehicle (Req 20.2)
export const listVehicleDocuments = async (req: Request, res: Response) => {
  try {
    const vehicleId = String(req.params.id);
    const docs = await prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { uploadedAt: 'desc' },
    });
    res.json(docs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// POST /api/vehicles/:id/documents — attach a document with a type label (Req 20.1)
export const addVehicleDocument = async (req: Request, res: Response) => {
  try {
    const vehicleId = String(req.params.id);
    const { typeLabel, fileName, url } = req.body;
    if (!typeLabel || !fileName) {
      return res.status(400).json({ message: 'typeLabel and fileName are required' });
    }
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const doc = await prisma.vehicleDocument.create({
      data: { vehicleId, typeLabel, fileName, url: url ?? '' },
    });
    res.status(201).json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to add document' });
  }
};

// DELETE /api/vehicles/:id/documents/:docId — remove a document (Req 20.3)
export const deleteVehicleDocument = async (req: Request, res: Response) => {
  try {
    const docId = String(req.params.docId);
    await prisma.vehicleDocument.delete({ where: { id: docId } });
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
