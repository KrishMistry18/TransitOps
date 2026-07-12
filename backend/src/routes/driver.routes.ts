import express from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// TODO: wire real RBAC once permissions.ts lands
router.get('/', authenticate, driverController.getDrivers);
router.get('/available', authenticate, driverController.getAvailableDrivers);
router.get('/expiring-licenses', authenticate, driverController.getExpiringLicenses);
router.post('/', authenticate, driverController.createDriver);
router.put('/:id', authenticate, driverController.updateDriver);
router.delete('/:id', authenticate, driverController.deleteDriver);

export default router;
