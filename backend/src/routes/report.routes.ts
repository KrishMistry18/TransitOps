import express from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

const canViewAnalytics = requireRole(
  ...Object.entries(PERMISSIONS)
    .filter(([_, p]) => p.analytics !== 'none')
    .map(([role]) => role as any)
);

router.get('/vehicles', authenticate, canViewAnalytics, reportController.getVehiclesReport);
router.get('/vehicles/export', authenticate, canViewAnalytics, reportController.exportVehiclesCSV);

// Note: /reports/fleet-utilization was in stubs, but fleetUtilization is now computed directly
// inside the dashboard controller GET /api/dashboard. We don't need a separate route unless specifically requested.

export default router;
