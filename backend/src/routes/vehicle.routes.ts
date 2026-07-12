import express from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = express.Router();

// Read: any role with fleet view/full. Write: FLEET_MANAGER only (Req 2.6).
router.get('/available', authenticate, vehicleController.getAvailableVehicles);
router.get('/', authenticate, requireFeature('fleet', 'view'), vehicleController.getVehicles);
router.post('/', authenticate, requireFeature('fleet', 'full'), vehicleController.createVehicle);
router.put('/:id', authenticate, requireFeature('fleet', 'full'), vehicleController.updateVehicle);
router.delete('/:id', authenticate, requireFeature('fleet', 'full'), vehicleController.retireVehicle);

// Vehicle documents (Req 20)
router.get('/:id/documents', authenticate, requireFeature('fleet', 'view'), vehicleController.listVehicleDocuments);
router.post('/:id/documents', authenticate, requireFeature('fleet', 'full'), vehicleController.addVehicleDocument);
router.delete('/:id/documents/:docId', authenticate, requireFeature('fleet', 'full'), vehicleController.deleteVehicleDocument);

export default router;
