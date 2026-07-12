import express from 'express';
import { getSettings, updateSettings, getPermissions } from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);
router.get('/permissions', authenticate, getPermissions);

export default router;
