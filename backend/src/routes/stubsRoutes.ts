import express from 'express';
import * as stubs from '../controllers/stubsController';

const router = express.Router();

// Vehicles
// Moved to real routes

// Drivers
// Moved to real routes

// Maintenance
// Moved to real routes

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
