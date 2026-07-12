import { Request, Response } from 'express';
import { db } from '../config/dbService';

// Vehicles
export const getVehicles = (req: Request, res: Response) => {
  res.json(db.getVehicles());
};

export const createVehicle = (req: Request, res: Response) => {
  const newVehicle = db.insertVehicle({
    registrationNumber: req.body.registrationNumber,
    name: req.body.name,
    type: req.body.type || 'Light Duty',
    maxLoadCapacity: Number(req.body.maxLoadCapacity) || 5000,
    odometer: Number(req.body.odometer) || 0,
    acquisitionCost: Number(req.body.acquisitionCost) || 30000,
    status: req.body.status || 'AVAILABLE',
    region: req.body.region || 'North'
  });
  res.json(newVehicle);
};

export const updateVehicle = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = db.updateVehicle(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(updated);
};

export const deleteVehicle = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = db.deleteVehicle(id);
  res.status(deleted ? 204 : 404).send();
};

// Drivers
export const getDrivers = (req: Request, res: Response) => {
  res.json(db.getDrivers());
};

export const getExpiringLicenses = (req: Request, res: Response) => {
  const now = new Date();
  const expiring = db.getDrivers().filter(d => new Date(d.licenseExpiryDate) < now);
  res.json(expiring);
};

export const createDriver = (req: Request, res: Response) => {
  const newDriver = db.insertDriver({
    name: req.body.name,
    licenseNumber: req.body.licenseNumber,
    licenseCategory: req.body.licenseCategory || 'CDL-A',
    licenseExpiryDate: req.body.licenseExpiryDate || new Date(Date.now() + 1000*60*60*24*365).toISOString(),
    contactNumber: req.body.contactNumber || '555-0100',
    safetyScore: Number(req.body.safetyScore) || 100,
    status: req.body.status || 'AVAILABLE'
  });
  res.json(newDriver);
};

export const updateDriver = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const updated = db.updateDriver(id, req.body);
  if (!updated) return res.status(404).json({ message: 'Driver not found' });
  res.json(updated);
};

export const deleteDriver = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const deleted = db.deleteDriver(id);
  res.status(deleted ? 204 : 404).send();
};

// Maintenance
export const getMaintenance = (req: Request, res: Response) => {
  res.json(db.getMaintenanceLogs());
};

export const createMaintenance = (req: Request, res: Response) => {
  const vehicleId = Number(req.body.vehicleId);
  const cost = Number(req.body.cost) || null;
  const newLog = db.insertMaintenanceLog({
    vehicleId,
    description: req.body.description || 'Routine Check',
    cost,
    status: 'ACTIVE',
    startDate: req.body.startDate || new Date().toISOString(),
    endDate: req.body.endDate || null
  });
  
  // Update vehicle status
  db.updateVehicle(vehicleId, { status: 'IN_SHOP' });
  
  res.json(newLog);
};

export const closeMaintenance = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const cost = req.body.cost !== undefined ? Number(req.body.cost) : undefined;
  const updated = db.updateMaintenanceLog(id, {
    status: 'CLOSED',
    endDate: new Date().toISOString(),
    ...(cost !== undefined ? { cost } : {})
  });
  if (!updated) return res.status(404).json({ message: 'Maintenance log not found' });

  // Update vehicle status back to AVAILABLE
  db.updateVehicle(updated.vehicleId, { status: 'AVAILABLE' });

  res.json(updated);
};

// Trips
export const getTrips = (req: Request, res: Response) => {
  res.json(db.getTrips());
};

export const createTrip = (req: Request, res: Response) => {
  const vehicleId = Number(req.body.vehicleId);
  const driverId = Number(req.body.driverId);
  const newTrip = db.insertTrip({
    source: req.body.source,
    destination: req.body.destination,
    vehicleId,
    driverId,
    cargoWeight: Number(req.body.cargoWeight) || 0,
    plannedDistance: Number(req.body.plannedDistance) || 0,
    status: 'DRAFT'
  });
  res.json(newTrip);
};

export const dispatchTrip = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const trip = db.getTrips().find(t => t.id === id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const updated = db.updateTrip(id, {
    status: 'DISPATCHED',
    dispatchedAt: new Date().toISOString()
  });

  // Update vehicle and driver status
  db.updateVehicle(trip.vehicleId, { status: 'ON_TRIP' });
  db.updateDriver(trip.driverId, { status: 'ON_TRIP' });

  res.json(updated);
};

export const completeTrip = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const trip = db.getTrips().find(t => t.id === id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const actualDistance = Number(req.body.actualDistance) || trip.plannedDistance;
  const fuelConsumed = Number(req.body.fuelConsumed) || Math.round(actualDistance * 0.2);
  const revenue = Number(req.body.revenue) || Math.round(actualDistance * 3.0);

  const updated = db.updateTrip(id, {
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    actualDistance,
    fuelConsumed,
    revenue
  });

  // Update vehicle and driver status back to AVAILABLE
  db.updateVehicle(trip.vehicleId, {
    status: 'AVAILABLE',
    odometer: db.getVehicles().find(v => v.id === trip.vehicleId)!.odometer + actualDistance
  });
  db.updateDriver(trip.driverId, { status: 'AVAILABLE' });

  // Automatically record fuel log
  const fuelCost = Math.round(fuelConsumed * 3.0); // e.g. $3 per liter
  db.insertFuelLog({
    vehicleId: trip.vehicleId,
    tripId: trip.id,
    liters: fuelConsumed,
    cost: fuelCost,
    date: new Date().toISOString()
  });

  res.json(updated);
};

export const cancelTrip = (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const trip = db.getTrips().find(t => t.id === id);
  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  const updated = db.updateTrip(id, { status: 'CANCELLED' });

  // Update vehicle and driver status back to AVAILABLE if they were dispatched
  if (trip.status === 'DISPATCHED') {
    db.updateVehicle(trip.vehicleId, { status: 'AVAILABLE' });
    db.updateDriver(trip.driverId, { status: 'AVAILABLE' });
  }

  res.json(updated);
};

// Fuel & Expenses
export const getFuelLogs = (req: Request, res: Response) => {
  res.json(db.getFuelLogs());
};

export const createFuelLog = (req: Request, res: Response) => {
  const newLog = db.insertFuelLog({
    vehicleId: Number(req.body.vehicleId),
    tripId: req.body.tripId ? Number(req.body.tripId) : null,
    liters: Number(req.body.liters) || 0,
    cost: Number(req.body.cost) || 0,
    date: req.body.date || new Date().toISOString()
  });
  res.json(newLog);
};

export const getExpenses = (req: Request, res: Response) => {
  res.json(db.getExpenses());
};

export const createExpense = (req: Request, res: Response) => {
  const newExpense = db.insertExpense({
    vehicleId: Number(req.body.vehicleId),
    type: req.body.type || 'OTHER',
    amount: Number(req.body.amount) || 0,
    description: req.body.description || '',
    date: req.body.date || new Date().toISOString()
  });
  res.json(newExpense);
};

// Legacy stubs for dashboard/reports (mostly covered by native controllers now)
export const getDashboard = (req: Request, res: Response) => {
  const vehicles = db.getVehicles();
  const trips = db.getTrips();
  const fuelLogs = db.getFuelLogs();

  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalRevenue = trips.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + (t.revenue || 0), 0);

  res.json({
    activeVehicles: vehicles.filter(v => v.status !== 'RETIRED').length,
    driversOnTrip: db.getDrivers().filter(d => d.status === 'ON_TRIP').length,
    totalTripsToday: trips.length,
    maintenanceAlerts: db.getMaintenanceLogs().filter(m => m.status === 'ACTIVE').length,
    fuelCostToday: Math.round(totalFuelCost / 30), // estimation
    revenueToday: Math.round(totalRevenue / 30),
    utilizationRate: 80
  });
};

export const getVehiclesReport = (req: Request, res: Response) => {
  const vehicles = db.getVehicles();
  const regionCounts: Record<string, number> = {};
  for (const v of vehicles) {
    regionCounts[v.region] = (regionCounts[v.region] || 0) + 1;
  }
  const report = Object.entries(regionCounts).map(([region, count]) => ({
    region,
    count
  }));
  res.json(report);
};

export const getFleetUtilization = (req: Request, res: Response) => {
  res.json([
    { month: 'Jan', rate: 75 },
    { month: 'Feb', rate: 78 },
    { month: 'Mar', rate: 82 },
    { month: 'Apr', rate: 80 },
    { month: 'May', rate: 85 },
    { month: 'Jun', rate: 81 }
  ]);
};

export const exportVehiclesCSV = (req: Request, res: Response) => {
  const vehicles = db.getVehicles();
  const csv = ['id,registrationNumber,name,type,status,region', ...vehicles.map(v => `${v.id},"${v.registrationNumber}","${v.name}","${v.type}",${v.status},"${v.region}"`)].join('\n');
  res.header('Content-Type', 'text/csv');
  res.attachment('vehicles-report.csv');
  res.send(csv);
};
