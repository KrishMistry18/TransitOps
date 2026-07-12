// src/routes/expense.routes.ts
import { Router } from 'express';
import { createExpense, listExpenses, getOperationalCost } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/rbac';

const router = Router();
router.post('/', authenticate, requireFeature('fuelExp', 'full'), createExpense);
router.get('/', authenticate, requireFeature('fuelExp', 'view'), listExpenses);
router.get('/operational-cost/:id', authenticate, requireFeature('fuelExp', 'view'), getOperationalCost);
export default router;
