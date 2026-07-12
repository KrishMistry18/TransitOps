import express from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = express.Router();

// Read: any role with drivers view/full. Write: SAFETY_OFFICER (drivers:full, Req 2.5).
router.get('/available', authenticate, driverController.getAvailableDrivers);
router.get('/expiring-licenses', authenticate, driverController.getExpiringLicenses);
router.get('/', authenticate, requireFeature('drivers', 'view'), driverController.getDrivers);
router.post('/', authenticate, requireFeature('drivers', 'full'), driverController.createDriver);
router.put('/:id', authenticate, requireFeature('drivers', 'full'), driverController.updateDriver);
router.delete('/:id', authenticate, requireFeature('drivers', 'full'), driverController.suspendDriver);

export default router;
