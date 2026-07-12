import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MaintenanceLogModel } from '../models/MaintenanceLog';
import { VehicleModel } from '../models/Vehicle';

export const createMaintenanceLog = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { vehicleId, description, cost, date } = req.body;

    const vehicle = await VehicleModel.findById(vehicleId).session(session);
    if (!vehicle) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.status === 'ON_TRIP') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cannot service a vehicle currently on a trip' });
    }
    
    // Check if it already has an ACTIVE maintenance record
    const activeLog = await MaintenanceLogModel.findOne({
      vehicleId,
      status: 'ACTIVE'
    }).session(session);

    if (activeLog) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Vehicle is already in shop' });
    }

    const log = await MaintenanceLogModel.create([{
      vehicle: vehicleId,
      description,
      cost: Number(cost),
      startDate: new Date(date),
      status: 'ACTIVE'
    }], { session });

    vehicle.status = 'IN_SHOP';
    await vehicle.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ log: log[0], vehicle });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: 'Failed to create maintenance log' });
  }
};

export const closeMaintenanceLog = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const logId = req.params.id;
    const log = await MaintenanceLogModel.findById(logId).populate('vehicle').session(session);

    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Maintenance log not found' });
    }
    
    if (log.status === 'CLOSED') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Maintenance log already closed' });
    }

    log.status = 'CLOSED';
    log.endDate = new Date();
    await log.save({ session });

    let vehicle = null;
    if (log.vehicle) {
      vehicle = await VehicleModel.findById(log.vehicle._id).session(session);
      if (vehicle && vehicle.status !== 'RETIRED') {
        vehicle.status = 'AVAILABLE';
        await vehicle.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      log,
      vehicle
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: 'Failed to close maintenance log' });
  }
};

export const getMaintenanceLogs = async (req: Request, res: Response) => {
  try {
    const logs = await MaintenanceLogModel.find()
      .populate({ path: 'vehicle', select: '-__v' })
      .sort({ startDate: -1 });
    
    const mappedLogs = logs.map(l => {
      const doc: any = l.toJSON();
      return doc;
    });
    res.json(mappedLogs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
};
