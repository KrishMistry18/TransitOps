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

export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { type, status, search } = req.query;
    const where: any = {};
    if (type) where.type = String(type);
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { registrationNumber: { contains: String(search), mode: 'insensitive' } },
        { name: { contains: String(search), mode: 'insensitive' } }
      ];
    }
    const vehicles = await prisma.vehicle.findMany({ where });
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.vehicle.findUnique({ where: { registrationNumber: req.body.registrationNumber } });
    if (existing) {
      return res.status(409).json({ message: 'Registration number already exists' });
    }
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: { status: 'RETIRED' }
    });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retire vehicle' });
  }
};
