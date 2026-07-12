import { Request, Response } from 'express';

const mockVehicles = [
  { id: 1, registrationNumber: 'TRK-2000', name: 'Truck 1', type: 'Heavy Duty', status: 'AVAILABLE', region: 'North' },
  { id: 2, registrationNumber: 'TRK-2001', name: 'Truck 2', type: 'Light Duty', status: 'ON_TRIP', region: 'South' },
  { id: 3, registrationNumber: 'TRK-2002', name: 'Truck 3', type: 'Heavy Duty', status: 'IN_SHOP', region: 'East' },
  { id: 4, registrationNumber: 'TRK-2003', name: 'Truck 4', type: 'Light Duty', status: 'RETIRED', region: 'West' }
];

const mockDrivers = [
  { id: 1, name: 'Driver 1', licenseNumber: 'LIC1000', status: 'AVAILABLE', licenseExpiryDate: new Date(Date.now() + 1000*60*60*24*365) },
  { id: 2, name: 'Driver 2', licenseNumber: 'LIC1001', status: 'ON_TRIP', licenseExpiryDate: new Date(Date.now() + 1000*60*60*24*365) },
  { id: 3, name: 'Driver 3', licenseNumber: 'LIC1002', status: 'OFF_DUTY', licenseExpiryDate: new Date(Date.now() + 1000*60*60*24*365) },
  { id: 4, name: 'Driver 4', licenseNumber: 'LIC1003', status: 'SUSPENDED', licenseExpiryDate: new Date(Date.now() - 1000*60*60*24*365) }
];

const mockTrips = [
  { id: 1, source: 'City A', destination: 'City B', status: 'DRAFT' },
  { id: 2, source: 'City C', destination: 'City D', status: 'DISPATCHED' },
  { id: 3, source: 'City E', destination: 'City F', status: 'COMPLETED' },
  { id: 4, source: 'City G', destination: 'City H', status: 'CANCELLED' }
];

const mockMaintenance = [
  { id: 1, vehicleId: 3, description: 'Engine repair', status: 'ACTIVE' },
  { id: 2, vehicleId: 1, description: 'Oil change', status: 'CLOSED' }
];

const mockFuel = [{ id: 1, vehicleId: 2, liters: 50, cost: 150 }];
const mockExpenses = [{ id: 1, type: 'TOLL', amount: 25 }];

const mockDashboard = {
  activeVehicles: 15,
  driversOnTrip: 8,
  totalTripsToday: 12,
  maintenanceAlerts: 3,
  fuelCostToday: 450,
  revenueToday: 2500,
  utilizationRate: 75
};

export const getVehicles = (req: Request, res: Response) => res.json(mockVehicles);
export const getAvailableVehicles = (req: Request, res: Response) => res.json(mockVehicles.filter(v => v.status === 'AVAILABLE'));
export const createVehicle = (req: Request, res: Response) => res.json({ id: 99, ...req.body });
export const updateVehicle = (req: Request, res: Response) => res.json({ id: req.params.id, ...req.body });
export const deleteVehicle = (req: Request, res: Response) => { res.status(204).send(); };

export const getDrivers = (req: Request, res: Response) => res.json(mockDrivers);
export const getAvailableDrivers = (req: Request, res: Response) => res.json(mockDrivers.filter(d => d.status === 'AVAILABLE'));
export const getExpiringLicenses = (req: Request, res: Response) => res.json(mockDrivers.filter(d => new Date(d.licenseExpiryDate) < new Date()));
export const createDriver = (req: Request, res: Response) => res.json({ id: 99, ...req.body });
export const updateDriver = (req: Request, res: Response) => res.json({ id: req.params.id, ...req.body });
export const deleteDriver = (req: Request, res: Response) => { res.status(204).send(); };

export const getMaintenance = (req: Request, res: Response) => res.json(mockMaintenance);
export const createMaintenance = (req: Request, res: Response) => res.json({ id: 99, ...req.body });
export const closeMaintenance = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'CLOSED' });

export const getTrips = (req: Request, res: Response) => res.json(mockTrips);
export const createTrip = (req: Request, res: Response) => res.json({ id: 99, ...req.body });
export const dispatchTrip = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'DISPATCHED' });
export const completeTrip = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'COMPLETED' });
export const cancelTrip = (req: Request, res: Response) => res.json({ id: req.params.id, status: 'CANCELLED' });

export const getFuelLogs = (req: Request, res: Response) => res.json(mockFuel);
export const createFuelLog = (req: Request, res: Response) => res.json({ id: 99, ...req.body });
export const getExpenses = (req: Request, res: Response) => res.json(mockExpenses);
export const createExpense = (req: Request, res: Response) => res.json({ id: 99, ...req.body });

export const getDashboard = (req: Request, res: Response) => res.json(mockDashboard);
export const getVehiclesReport = (req: Request, res: Response) => res.json([{ region: 'North', count: 10 }]);
export const getFleetUtilization = (req: Request, res: Response) => res.json([{ month: 'Jan', rate: 80 }]);
export const exportVehiclesCSV = (req: Request, res: Response) => {
  res.header('Content-Type', 'text/csv');
  res.attachment('vehicles.csv');
  res.send('id,registrationNumber,status\n1,TRK-2000,AVAILABLE\n2,TRK-2001,ON_TRIP');
};
