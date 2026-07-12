import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { TripModel } from '../models/Trip';
import { VehicleModel } from '../models/Vehicle';
import { DriverModel } from '../models/Driver';
import { FuelLogModel } from '../models/FuelLog';

// GET /api/trips — populate vehicle + driver
export const getTrips = async (req: Request, res: Response) => {
  try {
    const trips = await TripModel.find()
      .populate({ path: 'vehicle', select: '-__v' })
      .populate({ path: 'driver', select: '-__v' })
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

// POST /api/trips — creates a DRAFT trip
export const createTrip = async (req: Request, res: Response) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;
    const trip = await TripModel.create({
      source,
      destination,
      vehicle: vehicleId || null,
      driver: driverId || null,
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance),
      status: 'DRAFT',
      createdBy: req.user?.userId,
    });
    // Re-fetch with populated fields
    const populated = await TripModel.findById(trip._id)
      .populate({ path: 'vehicle', select: '-__v' })
      .populate({ path: 'driver', select: '-__v' });
    res.status(201).json(populated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

// POST /api/trips/:id/dispatch
export const dispatchTrip = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      // Re-fetch trip inside transaction
      const trip = await TripModel.findById(req.params.id).session(session);
      if (!trip) throw Object.assign(new Error('Trip not found'), { status: 404 });

      // Rule 1: must be DRAFT
      if (trip.status !== 'DRAFT') {
        throw Object.assign(new Error('Trip must be in DRAFT status to dispatch'), { status: 400 });
      }

      const vehicleId = req.body.vehicleId || trip.vehicle;
      const driverId = req.body.driverId || trip.driver;

      if (!vehicleId || !driverId) {
        throw Object.assign(new Error('Vehicle and driver must be assigned before dispatch'), { status: 400 });
      }

      // Rule 2: vehicle must be AVAILABLE (re-check live)
      const vehicle = await VehicleModel.findById(vehicleId).session(session);
      if (!vehicle) throw Object.assign(new Error('Vehicle not found'), { status: 404 });
      if (vehicle.status !== 'AVAILABLE') {
        throw Object.assign(new Error('Selected vehicle is not available'), { status: 400 });
      }

      // Rule 3: driver must be AVAILABLE and license not expired
      const driver = await DriverModel.findById(driverId).session(session);
      if (!driver) throw Object.assign(new Error('Driver not found'), { status: 404 });
      if (driver.status !== 'AVAILABLE') {
        throw Object.assign(new Error('Selected driver is not available'), { status: 400 });
      }
      if (new Date(driver.licenseExpiryDate) <= new Date()) {
        throw Object.assign(new Error('Driver\'s license has expired'), { status: 400 });
      }

      // Rule 4: cargoWeight <= maxLoadCapacity
      const cargoWeight = req.body.cargoWeight !== undefined ? Number(req.body.cargoWeight) : trip.cargoWeight;
      if (cargoWeight > vehicle.maxLoadCapacity) {
        throw Object.assign(
          new Error(`Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${vehicle.maxLoadCapacity} kg)`),
          { status: 400 }
        );
      }

      // All checks passed — update within transaction
      trip.vehicle = vehicleId;
      trip.driver = driverId;
      trip.status = 'DISPATCHED';
      trip.dispatchedAt = new Date();
      if (req.body.cargoWeight !== undefined) trip.cargoWeight = cargoWeight;
      await trip.save({ session });

      vehicle.status = 'ON_TRIP';
      await vehicle.save({ session });

      driver.status = 'ON_TRIP';
      await driver.save({ session });

      result = { trip, vehicle, driver };
    });

    // Re-fetch with populated fields after transaction
    const populated = await TripModel.findById(req.params.id)
      .populate({ path: 'vehicle', select: '-__v' })
      .populate({ path: 'driver', select: '-__v' });
    res.json(populated);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Vehicle or driver is already on another dispatched trip' });
    }
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Failed to dispatch trip' });
  } finally {
    session.endSession();
  }
};

// POST /api/trips/:id/complete — body: { finalOdometer, fuelConsumed }
export const completeTrip = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let populated: any;
    await session.withTransaction(async () => {
      const trip = await TripModel.findById(req.params.id).session(session);
      if (!trip) throw Object.assign(new Error('Trip not found'), { status: 404 });
      if (trip.status !== 'DISPATCHED') {
        throw Object.assign(new Error('Only dispatched trips can be completed'), { status: 400 });
      }

      const { finalOdometer, fuelConsumed, actualDistance, revenue } = req.body;

      trip.status = 'COMPLETED';
      trip.completedAt = new Date();
      if (actualDistance !== undefined) trip.actualDistance = Number(actualDistance);
      if (fuelConsumed !== undefined) trip.fuelConsumed = Number(fuelConsumed);
      if (revenue !== undefined) trip.revenue = Number(revenue);
      await trip.save({ session });

      // Restore vehicle
      if (trip.vehicle) {
        const vehicle = await VehicleModel.findById(trip.vehicle).session(session);
        if (vehicle) {
          vehicle.status = 'AVAILABLE';
          if (finalOdometer !== undefined) vehicle.odometer = Number(finalOdometer);
          await vehicle.save({ session });
        }
      }

      // Restore driver
      if (trip.driver) {
        const driver = await DriverModel.findById(trip.driver).session(session);
        if (driver) {
          driver.status = 'AVAILABLE';
          await driver.save({ session });
        }
      }

      // Create FuelLog if fuelConsumed provided
      if (fuelConsumed !== undefined && Number(fuelConsumed) > 0 && trip.vehicle) {
        await FuelLogModel.create([{
          vehicle: trip.vehicle,
          trip: trip._id,
          liters: Number(fuelConsumed),
          cost: 0, // cost updated separately if needed
          date: new Date(),
        }], { session });
      }
    });

    populated = await TripModel.findById(req.params.id)
      .populate({ path: 'vehicle', select: '-__v' })
      .populate({ path: 'driver', select: '-__v' });
    res.json(populated);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Failed to complete trip' });
  } finally {
    session.endSession();
  }
};

// POST /api/trips/:id/cancel — only from DRAFT or DISPATCHED
export const cancelTrip = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let populated: any;
    await session.withTransaction(async () => {
      const trip = await TripModel.findById(req.params.id).session(session);
      if (!trip) throw Object.assign(new Error('Trip not found'), { status: 404 });

      if (trip.status !== 'DRAFT' && trip.status !== 'DISPATCHED') {
        throw Object.assign(new Error('Only DRAFT or DISPATCHED trips can be cancelled'), { status: 400 });
      }

      const wasDispatched = trip.status === 'DISPATCHED';
      trip.status = 'CANCELLED';
      trip.cancelledAt = new Date();
      await trip.save({ session });

      // If trip was dispatched, restore vehicle and driver
      if (wasDispatched) {
        if (trip.vehicle) {
          const vehicle = await VehicleModel.findById(trip.vehicle).session(session);
          if (vehicle && vehicle.status !== 'RETIRED') {
            vehicle.status = 'AVAILABLE';
            await vehicle.save({ session });
          }
        }
        if (trip.driver) {
          const driver = await DriverModel.findById(trip.driver).session(session);
          if (driver && driver.status !== 'SUSPENDED') {
            driver.status = 'AVAILABLE';
            await driver.save({ session });
          }
        }
      }
    });

    populated = await TripModel.findById(req.params.id)
      .populate({ path: 'vehicle', select: '-__v' })
      .populate({ path: 'driver', select: '-__v' });
    res.json(populated);
  } catch (err: any) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Failed to cancel trip' });
  } finally {
    session.endSession();
  }
};
