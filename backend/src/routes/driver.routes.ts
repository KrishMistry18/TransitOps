import express from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

const checkDriversPermission = (level: 'view' | 'full') => {
  return requireRole(
    ...Object.entries(PERMISSIONS)
      .filter(([_, perms]) => perms.drivers === level || perms.drivers === 'full')
      .map(([role]) => role as any)
  );
};

router.get('/', authenticate, checkDriversPermission('view'), driverController.getDrivers);
router.get('/available', authenticate, checkDriversPermission('view'), driverController.getAvailableDrivers);
router.get('/expiring-licenses', authenticate, checkDriversPermission('view'), driverController.getExpiringLicenses);
router.post('/', authenticate, checkDriversPermission('full'), driverController.createDriver);
router.put('/:id', authenticate, checkDriversPermission('full'), driverController.updateDriver);
router.delete('/:id', authenticate, checkDriversPermission('full'), driverController.deleteDriver);

export default router;
