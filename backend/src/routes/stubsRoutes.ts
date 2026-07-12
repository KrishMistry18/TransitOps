import express from 'express';
import * as stubs from '../controllers/stubsController';

const router = express.Router();

// Vehicles
router.get('/vehicles', stubs.getVehicles);
router.get('/vehicles/available', stubs.getAvailableVehicles);
router.post('/vehicles', stubs.createVehicle);
router.put('/vehicles/:id', stubs.updateVehicle);
router.delete('/vehicles/:id', stubs.deleteVehicle);

// Drivers
router.get('/drivers', stubs.getDrivers);
router.get('/drivers/available', stubs.getAvailableDrivers);
router.get('/drivers/expiring-licenses', stubs.getExpiringLicenses);
router.post('/drivers', stubs.createDriver);
router.put('/drivers/:id', stubs.updateDriver);
router.delete('/drivers/:id', stubs.deleteDriver);

// Maintenance
router.get('/maintenance', stubs.getMaintenance);
router.post('/maintenance', stubs.createMaintenance);
router.post('/maintenance/:id/close', stubs.closeMaintenance);

// Trips
router.get('/trips', stubs.getTrips);
router.post('/trips', stubs.createTrip);
router.post('/trips/:id/dispatch', stubs.dispatchTrip);
router.post('/trips/:id/complete', stubs.completeTrip);
router.post('/trips/:id/cancel', stubs.cancelTrip);

// Fuel & Expenses
router.get('/fuel-logs', stubs.getFuelLogs);
router.post('/fuel-logs', stubs.createFuelLog);
router.get('/expenses', stubs.getExpenses);
router.post('/expenses', stubs.createExpense);

// Dashboard & Reports
router.get('/dashboard', stubs.getDashboard);
router.get('/reports/vehicles', stubs.getVehiclesReport);
router.get('/reports/fleet-utilization', stubs.getFleetUtilization);
router.get('/reports/vehicles/export', stubs.exportVehiclesCSV);

export default router;
