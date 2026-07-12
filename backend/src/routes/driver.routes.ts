import express from 'express';
import * as driverController from '../controllers/driver.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// TODO: wire real RBAC once permissions.ts lands
router.get('/available', authenticate, driverController.getAvailableDrivers);

export default router;
