import express from 'express';
import { getSettings, updateSettings, getPermissions } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, requireRole('FLEET_MANAGER'), updateSettings);
router.get('/permissions', authenticate, getPermissions);

export default router;
