import express from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// TODO: wire real RBAC once permissions.ts lands
router.get('/', authenticate, vehicleController.getVehicles);
router.get('/available', authenticate, vehicleController.getAvailableVehicles);
router.post('/', authenticate, vehicleController.createVehicle);
router.put('/:id', authenticate, vehicleController.updateVehicle);
router.delete('/:id', authenticate, vehicleController.deleteVehicle);

export default router;
