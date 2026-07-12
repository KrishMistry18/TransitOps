import { Request, Response } from 'express';
import { FuelLogModel } from '../models/FuelLog';

// GET /api/fuel-logs — filterable by vehicleId
export const getFuelLogs = async (req: Request, res: Response) => {
  try {
    const query: any = {};
    if (req.query.vehicleId) query.vehicle = req.query.vehicleId;
    const logs = await FuelLogModel.find(query)
      .populate({ path: 'vehicle', select: 'name registrationNumber' })
      .populate({ path: 'trip', select: 'source destination status' })
      .sort({ date: -1 });
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch fuel logs' });
  }
};

// POST /api/fuel-logs — { vehicleId, liters, cost, date }
export const createFuelLog = async (req: Request, res: Response) => {
  try {
    const { vehicleId, liters, cost, date, tripId } = req.body;

    if (Number(liters) < 0) return res.status(400).json({ message: 'Liters must be >= 0' });
    if (Number(cost) < 0) return res.status(400).json({ message: 'Cost must be >= 0' });

    const log = await FuelLogModel.create({
      vehicle: vehicleId,
      trip: tripId || null,
      liters: Number(liters),
      cost: Number(cost),
      date: date ? new Date(date) : new Date(),
    });

    const populated = await FuelLogModel.findById(log._id)
      .populate({ path: 'vehicle', select: 'name registrationNumber' });
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create fuel log' });
  }
};
