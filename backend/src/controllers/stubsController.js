// STUB — owned by teammates, replace with real Prisma queries

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
  { id: 4, name: 'Driver 4', licenseNumber: 'LIC1003', status: 'SUSPENDED', licenseExpiryDate: new Date(Date.now() - 1000*60*60*24*365) } // Expired
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

module.exports = {
  // Vehicles
  getVehicles: (req, res) => res.json(mockVehicles),
  getAvailableVehicles: (req, res) => res.json(mockVehicles.filter(v => v.status === 'AVAILABLE')),
  createVehicle: (req, res) => res.json({ id: 99, ...req.body }),
  updateVehicle: (req, res) => res.json({ id: req.params.id, ...req.body }),
  deleteVehicle: (req, res) => res.status(204).send(),

  // Drivers
  getDrivers: (req, res) => res.json(mockDrivers),
  getAvailableDrivers: (req, res) => res.json(mockDrivers.filter(d => d.status === 'AVAILABLE')),
  getExpiringLicenses: (req, res) => res.json(mockDrivers.filter(d => new Date(d.licenseExpiryDate) < new Date())),
  createDriver: (req, res) => res.json({ id: 99, ...req.body }),
  updateDriver: (req, res) => res.json({ id: req.params.id, ...req.body }),
  deleteDriver: (req, res) => res.status(204).send(),

  // Maintenance
  getMaintenance: (req, res) => res.json(mockMaintenance),
  createMaintenance: (req, res) => res.json({ id: 99, ...req.body }),
  closeMaintenance: (req, res) => res.json({ id: req.params.id, status: 'CLOSED' }),

  // Trips
  getTrips: (req, res) => res.json(mockTrips),
  createTrip: (req, res) => res.json({ id: 99, ...req.body }),
  dispatchTrip: (req, res) => res.json({ id: req.params.id, status: 'DISPATCHED' }),
  completeTrip: (req, res) => res.json({ id: req.params.id, status: 'COMPLETED' }),
  cancelTrip: (req, res) => res.json({ id: req.params.id, status: 'CANCELLED' }),

  // Fuel & Expenses
  getFuelLogs: (req, res) => res.json(mockFuel),
  createFuelLog: (req, res) => res.json({ id: 99, ...req.body }),
  getExpenses: (req, res) => res.json(mockExpenses),
  createExpense: (req, res) => res.json({ id: 99, ...req.body }),

  // Dashboard & Reports
  getDashboard: (req, res) => res.json(mockDashboard),
  getVehiclesReport: (req, res) => res.json([{ region: 'North', count: 10 }]),
  getFleetUtilization: (req, res) => res.json([{ month: 'Jan', rate: 80 }]),
  exportVehiclesCSV: (req, res) => {
    res.header('Content-Type', 'text/csv');
    res.attachment('vehicles.csv');
    res.send('id,registrationNumber,status\n1,TRK-2000,AVAILABLE\n2,TRK-2001,ON_TRIP');
  }
};
