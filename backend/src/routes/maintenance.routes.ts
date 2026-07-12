import express from 'express';
import * as maintenanceController from '../controllers/maintenance.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

const checkFleetPermission = (level: 'view' | 'full') => {
  return requireRole(
    ...Object.entries(PERMISSIONS)
      .filter(([_, perms]) => perms.fleet === level || perms.fleet === 'full')
      .map(([role]) => role as any)
  );
};

router.get('/', authenticate, checkFleetPermission('view'), maintenanceController.getMaintenanceLogs);
router.post('/', authenticate, checkFleetPermission('full'), maintenanceController.createMaintenanceLog);
router.post('/:id/close', authenticate, checkFleetPermission('full'), maintenanceController.closeMaintenanceLog);

export default router;
