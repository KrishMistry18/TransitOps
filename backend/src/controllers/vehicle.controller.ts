import { Request, Response } from 'express';
import { VehicleModel } from '../models/Vehicle';

export const getAvailableVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = await VehicleModel.find({ status: 'AVAILABLE' });
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
      where.$or = [
        { registrationNumber: { $regex: String(search), $options: 'i' } },
        { name: { $regex: String(search), $options: 'i' } }
      ];
    }
    const vehicles = await VehicleModel.find(where);
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const existing = await VehicleModel.findOne({ registrationNumber: req.body.registrationNumber });
    if (existing) {
      return res.status(409).json({ message: 'Registration number already exists' });
    }
    const vehicle = await VehicleModel.create(req.body);
    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await VehicleModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const vehicle = await VehicleModel.findByIdAndUpdate(req.params.id, { status: 'RETIRED' }, { new: true });
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retire vehicle' });
  }
};
