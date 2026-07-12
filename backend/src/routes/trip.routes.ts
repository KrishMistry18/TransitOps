import express from 'express';
import * as tripController from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

// Trips permission: DISPATCHER=full, FLEET_MANAGER=view, SAFETY_OFFICER=view
const canViewTrips = requireRole(
  ...Object.entries(PERMISSIONS)
    .filter(([_, p]) => p.trips !== 'none')
    .map(([role]) => role as any)
);
const canManageTrips = requireRole(
  ...Object.entries(PERMISSIONS)
    .filter(([_, p]) => p.trips === 'full')
    .map(([role]) => role as any)
);

router.get('/', authenticate, canViewTrips, tripController.getTrips);
router.post('/', authenticate, canManageTrips, tripController.createTrip);
router.post('/:id/dispatch', authenticate, canManageTrips, tripController.dispatchTrip);
router.post('/:id/complete', authenticate, canManageTrips, tripController.completeTrip);
router.post('/:id/cancel', authenticate, canManageTrips, tripController.cancelTrip);

export default router;
