// src/routes/fuel.routes.ts
import { Router } from 'express';
import { createFuelLog, listFuelLogs, listFlaggedFuelLogs } from '../controllers/fuel.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = Router();
router.post('/', authenticate, requireFeature('fuelExp', 'full'), createFuelLog);
router.get('/', authenticate, requireFeature('fuelExp', 'view'), listFuelLogs);
router.get('/flagged', authenticate, requireFeature('fuelExp', 'view'), listFlaggedFuelLogs); // keep ABOVE any '/:id'
export default router;
