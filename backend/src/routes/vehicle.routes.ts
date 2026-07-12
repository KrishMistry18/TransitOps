import express from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
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

router.get('/', authenticate, checkFleetPermission('view'), vehicleController.getVehicles);
router.get('/available', authenticate, checkFleetPermission('view'), vehicleController.getAvailableVehicles);
router.post('/', authenticate, checkFleetPermission('full'), vehicleController.createVehicle);
router.put('/:id', authenticate, checkFleetPermission('full'), vehicleController.updateVehicle);
router.delete('/:id', authenticate, checkFleetPermission('full'), vehicleController.deleteVehicle);

export default router;
