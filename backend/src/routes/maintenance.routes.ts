import express from 'express';
import * as maintenanceController from '../controllers/maintenance.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = express.Router();

router.get('/', authenticate, requireFeature('maintenance', 'view'), maintenanceController.getMaintenanceLogs);
router.post('/', authenticate, requireFeature('maintenance', 'full'), maintenanceController.createMaintenanceLog);
router.post('/:id/close', authenticate, requireFeature('maintenance', 'full'), maintenanceController.closeMaintenanceLog);

export default router;
