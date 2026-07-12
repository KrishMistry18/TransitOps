import express from 'express';
import * as maintenanceController from '../controllers/maintenance.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// TODO: wire real RBAC once permissions.ts lands
router.get('/', authenticate, maintenanceController.getMaintenanceLogs);
router.post('/', authenticate, maintenanceController.createMaintenanceLog);
router.post('/:id/close', authenticate, maintenanceController.closeMaintenanceLog);

export default router;
