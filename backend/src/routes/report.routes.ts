import express from 'express';
import { getVehiclesReport, getFleetUtilization, exportVehiclesCSV, exportVehiclesPDF } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = express.Router();

router.get('/vehicles', authenticate, requireFeature('analytics', 'view'), getVehiclesReport);
router.get('/fleet-utilization', authenticate, requireFeature('analytics', 'view'), getFleetUtilization);
router.get('/vehicles/export', authenticate, requireFeature('analytics', 'view'), exportVehiclesCSV);
router.get('/vehicles/export-pdf', authenticate, requireFeature('analytics', 'view'), exportVehiclesPDF);

export default router;
