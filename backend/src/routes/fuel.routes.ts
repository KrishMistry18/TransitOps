// src/routes/fuel.routes.ts
import { Router } from 'express';
import { createFuelLog, listFuelLogs, listFlaggedFuelLogs, getFuelStats } from '../controllers/fuel.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = Router();
router.get('/stats', authenticate, requireFeature('fuelExp', 'view'), getFuelStats);
router.get('/flagged', authenticate, requireFeature('fuelExp', 'view'), listFlaggedFuelLogs); // keep ABOVE any '/:id'
router.post('/', authenticate, requireFeature('fuelExp', 'full'), createFuelLog);
router.get('/', authenticate, requireFeature('fuelExp', 'view'), listFuelLogs);
export default router;
