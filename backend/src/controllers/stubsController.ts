import { Request, Response } from 'express';
import { Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense, DashboardKPIs, VehicleReportRow } from '@shared/types';

const mockVehicles: Vehicle[] = [
  { id: "1", registrationNumber: 'TRK-2000', name: 'Truck 1', type: 'Heavy Duty', maxLoadCapacity: 10000, odometer: 50000, acquisitionCost: 80000, status: 'AVAILABLE', region: 'North' },
  { id: "2", registrationNumber: 'TRK-2001', name: 'Truck 2', type: 'Light Duty', maxLoadCapacity: 5000, odometer: 60000, acquisitionCost: 40000, status: 'ON_TRIP', region: 'South' },
  { id: "3", registrationNumber: 'TRK-2002', name: 'Truck 3', type: 'Heavy Duty', maxLoadCapacity: 12000, odometer: 70000, acquisitionCost: 90000, status: 'IN_SHOP', region: 'East' },
  { id: "4", registrationNumber: 'TRK-2003', name: 'Truck 4', type: 'Light Duty', maxLoadCapacity: 5500, odometer: 150000, acquisitionCost: 45000, status: 'RETIRED', region: 'West' }
];

const mockDrivers: Driver[] = [
  { id: "1", name: 'Driver 1', licenseNumber: 'LIC1000', licenseCategory: 'CDL-A', licenseExpiryDate: new Date(Date.now() + 1000*60*60*24*365), contactNumber: '555-0100', safetyScore: 95, status: 'AVAILABLE' },
  { id: "2", name: 'Driver 2', licenseNumber: 'LIC1001', licenseCategory: 'CDL-B', licenseExpiryDate: new Date(Date.now() + 1000*60*60*24*365), contactNumber: '555-0101', safetyScore: 90, status: 'ON_TRIP' },
  { id: "3", name: 'Driver 3', licenseNumber: 'LIC1002', licenseCategory: 'CDL-A', licenseExpiryDate: new Date(Date.now() + 1000*60*60*24*365), contactNumber: '555-0102', safetyScore: 92, status: 'OFF_DUTY' },
  { id: "4", name: 'Driver 4', licenseNumber: 'LIC1003', licenseCategory: 'CDL-B', licenseExpiryDate: new Date(Date.now() - 1000*60*60*24*365), contactNumber: '555-0103', safetyScore: 60, status: 'SUSPENDED' }
];

const mockTrips: Trip[] = [
  { id: "1", source: 'City A', destination: 'City B', vehicleId: "1", driverId: "1", cargoWeight: 5000, plannedDistance: 500, status: 'DRAFT' },
  { id: "2", source: 'City C', destination: 'City D', vehicleId: "2", driverId: "2", cargoWeight: 3000, plannedDistance: 300, status: 'DISPATCHED', dispatchedAt: new Date() },
  { id: "3", source: 'City E', destination: 'City F', vehicleId: "3", driverId: "3", cargoWeight: 8000, plannedDistance: 800, actualDistance: 820, fuelConsumed: 160, revenue: 2400, status: 'COMPLETED', dispatchedAt: new Date(), completedAt: new Date() },
  { id: "4", source: 'City G', destination: 'City H', vehicleId: "4", driverId: "4", cargoWeight: 4000, plannedDistance: 400, status: 'CANCELLED' }
];

const mockMaintenance: MaintenanceLog[] = [
  { id: "1", vehicleId: "3", description: 'Engine repair', cost: 1500, status: 'ACTIVE', startDate: new Date() },
  { id: "2", vehicleId: "1", description: 'Oil change', cost: 200, status: 'CLOSED', startDate: new Date(), endDate: new Date() }
];

const mockFuel: FuelLog[] = [{ id: "1", vehicleId: "2", tripId: "2", liters: 50, cost: 150, date: new Date() }];
const mockExpenses: Expense[] = [{ id: "1", vehicleId: "1", type: 'TOLL', amount: 25, description: 'Highway Toll', date: new Date() }];

const mockDashboard: DashboardKPIs = {
  activeVehicles: 15,
  driversOnTrip: 8,
  totalTripsToday: 12,
  maintenanceAlerts: 3,
  fuelCostToday: 450,
  revenueToday: 2500,
  utilizationRate: 75
};

// STUB — replace with real Mongoose queries
export const getVehicles = (req: Request, res: Response) => res.json(mockVehicles);
// STUB — replace with real Mongoose queries
export const createVehicle = (req: Request, res: Response) => res.json({ id: "99", ...req.body });
// STUB — replace with real Mongoose queries
export const updateVehicle = (req: Request, res: Response) => res.json({ id: req.params.id, ...req.body });
// STUB — replace with real Mongoose queries
export const deleteVehicle = (req: Request, res: Response) => { res.status(204).send(); };

// STUB — replace with real Mongoose queries
export const getDrivers = (req: Request, res: Response) => res.json(mockDrivers);
// STUB — replace with real Mongoose queries
export const getExpiringLicenses = (req: Request, res: Response) => res.json(mockDrivers.filter(d => new Date(d.licenseExpiryDate) < new Date()));
// STUB — replace with real Mongoose queries
export const createDriver = (req: Request, res: Response) => res.json({ id: "99", ...req.body });
// STUB — replace with real Mongoose queries
export const updateDriver = (req: Request, res: Response) => res.json({ id: req.params.id, ...req.body });
// STUB — replace with real Mongoose queries
export const deleteDriver = (req: Request, res: Response) => { res.status(204).send(); };

// STUB — replace with real Mongoose queries
export const getTrips = (req: Request, res: Response) => res.json(mockTrips);
// STUB — replace with real Mongoose queries
export const createTrip = (req: Request, res: Response) => res.json({ id: "99", ...req.body });
// STUB — replace with real Mongoose queries
export const dispatchTrip = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'DISPATCHED' });
// STUB — replace with real Mongoose queries
export const completeTrip = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'COMPLETED' });
// STUB — replace with real Mongoose queries
export const cancelTrip = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'CANCELLED' });

// STUB — replace with real Mongoose queries
export const getFuelLogs = (req: Request, res: Response) => res.json(mockFuel);
// STUB — replace with real Mongoose queries
export const createFuelLog = (req: Request, res: Response) => res.json({ id: "99", ...req.body });
// STUB — replace with real Mongoose queries
export const getExpenses = (req: Request, res: Response) => res.json(mockExpenses);
// STUB — replace with real Mongoose queries
export const createExpense = (req: Request, res: Response) => res.json({ id: "99", ...req.body });

// STUB — replace with real Mongoose queries
export const getDashboard = (req: Request, res: Response) => res.json(mockDashboard);
// STUB — replace with real Mongoose queries
export const getVehiclesReport = (req: Request, res: Response) => res.json([{ region: 'North', count: 10 }] as VehicleReportRow[]);
// STUB — replace with real Mongoose queries
export const getFleetUtilization = (req: Request, res: Response) => res.json([{ month: 'Jan', rate: 80 }] as VehicleReportRow[]);
// STUB — replace with real Mongoose queries
export const exportVehiclesCSV = (req: Request, res: Response) => {
  res.header('Content-Type', 'text/csv');
  res.attachment('vehicles.csv');
  res.send('id,registrationNumber,status\n1,TRK-2000,AVAILABLE\n2,TRK-2001,ON_TRIP');
};
