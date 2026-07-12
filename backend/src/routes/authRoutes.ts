import express from 'express';
import { login, getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;
