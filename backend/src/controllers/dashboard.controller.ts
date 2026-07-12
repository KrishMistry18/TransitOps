import { Request, Response } from 'express';
import { VehicleModel } from '../models/Vehicle';
import { TripModel } from '../models/Trip';
import { DriverModel } from '../models/Driver';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const { type, status, region } = req.query;
    
    // Filter vehicles by query params
    const vehicleQuery: any = {};
    if (type) vehicleQuery.type = type;
    if (status) vehicleQuery.status = status;
    if (region) vehicleQuery.region = region;

    // Get filtered vehicle IDs to scope other queries if there are filters
    const filteredVehicles = Object.keys(vehicleQuery).length > 0 
      ? await VehicleModel.find(vehicleQuery).select('_id') 
      : null;
      
    const vehicleIds = filteredVehicles ? filteredVehicles.map(v => v._id) : null;

    const baseVehicleQuery = vehicleIds ? { _id: { $in: vehicleIds } } : {};
    const baseTripQuery = vehicleIds ? { vehicle: { $in: vehicleIds } } : {};

    // Execute queries independently with Promise.allSettled
    const results = await Promise.allSettled([
      VehicleModel.countDocuments({ ...baseVehicleQuery, status: 'ON_TRIP' }),
      VehicleModel.countDocuments({ ...baseVehicleQuery, status: 'AVAILABLE' }),
      VehicleModel.countDocuments({ ...baseVehicleQuery, status: 'IN_SHOP' }),
      TripModel.countDocuments({ ...baseTripQuery, status: 'DISPATCHED' }),
      TripModel.countDocuments({ ...baseTripQuery, status: 'DRAFT' }),
      DriverModel.countDocuments({ status: 'ON_TRIP' }), // Usually drivers are independent of vehicle filter, but we could cross-reference. Keeping it simple.
      VehicleModel.countDocuments({ ...baseVehicleQuery, status: { $ne: 'RETIRED' } })
    ]);

    const getValue = (index: number) => 
      results[index].status === 'fulfilled' ? (results[index] as PromiseFulfilledResult<number>).value : null;

    const activeVehicles = getValue(0);
    const availableVehicles = getValue(1);
    const vehiclesInMaintenance = getValue(2);
    const activeTrips = getValue(3);
    const pendingTrips = getValue(4);
    const driversOnDuty = getValue(5);
    const totalNonRetired = getValue(6);

    let fleetUtilization: number | null = null;
    if (activeVehicles !== null && totalNonRetired !== null && totalNonRetired > 0) {
      fleetUtilization = (activeVehicles / totalNonRetired) * 100;
    }

    res.json({
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      _warnings: results.some(r => r.status === 'rejected') ? 'Some metrics failed to load' : undefined
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};
