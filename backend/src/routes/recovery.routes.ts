import express from 'express';
import { reportDisruptionHandler, getCandidatesHandler, reassignHandler } from '../controllers/recovery.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

// Report disruption: Fleet_Manager (any type) or Safety_Officer (Driver_Unavailable only, enforced in controller).
router.post('/disruption', authenticate, requireRole('FLEET_MANAGER', 'SAFETY_OFFICER'), reportDisruptionHandler);
// Candidate listing + reassignment: Fleet_Manager (Req 22.7).
router.get('/candidates/:tripId', authenticate, requireRole('FLEET_MANAGER'), getCandidatesHandler);
router.post('/reassign', authenticate, requireRole('FLEET_MANAGER'), reassignHandler);

export default router;
