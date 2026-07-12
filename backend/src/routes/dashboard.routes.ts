import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

const canViewAnalytics = requireRole(
  ...Object.entries(PERMISSIONS)
    .filter(([_, p]) => p.analytics !== 'none')
    .map(([role]) => role as any)
);

router.get('/', authenticate, canViewAnalytics, dashboardController.getDashboard);

export default router;
