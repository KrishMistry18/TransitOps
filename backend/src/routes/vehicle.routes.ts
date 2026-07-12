import express from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// TODO: wire real RBAC once permissions.ts lands
router.get('/available', authenticate, vehicleController.getAvailableVehicles);

export default router;
