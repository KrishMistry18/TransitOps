// src/routes/trip.routes.ts
import { Router } from 'express';
import {
  createTrip, listTrips, getTrip, dispatchTrip, completeTrip, cancelTrip,
  getTripEligibility, estimateTrip,
} from '../controllers/trip.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = Router();

// Static routes BEFORE '/:id' so they aren't captured as an id.
router.get('/eligibility', authenticate, requireFeature('trips', 'view'), getTripEligibility);
router.get('/estimate', authenticate, requireFeature('trips', 'view'), estimateTrip);

// Read: any role with trips view/full. Write/dispatch: DRIVER (trips:full, Req 2.7).
router.get('/', authenticate, requireFeature('trips', 'view'), listTrips);
router.get('/:id', authenticate, requireFeature('trips', 'view'), getTrip);
router.post('/', authenticate, requireFeature('trips', 'full'), createTrip);
router.post('/:id/dispatch', authenticate, requireFeature('trips', 'full'), dispatchTrip);
router.post('/:id/complete', authenticate, requireFeature('trips', 'full'), completeTrip);
router.post('/:id/cancel', authenticate, requireFeature('trips', 'full'), cancelTrip);

export default router;
