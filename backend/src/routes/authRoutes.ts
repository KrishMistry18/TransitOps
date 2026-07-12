import express from 'express';
import { login, getMe, requestAccess } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.post('/request-access', requestAccess);
router.get('/me', authenticate, getMe);

export default router;
