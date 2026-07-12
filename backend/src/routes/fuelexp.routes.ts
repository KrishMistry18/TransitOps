import express from 'express';
import * as fuelController from '../controllers/fuel.controller';
import * as expenseController from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { PERMISSIONS } from '../config/permissions';

const router = express.Router();

const canViewFuelExp = requireRole(
  ...Object.entries(PERMISSIONS)
    .filter(([_, p]) => p.fuelExp !== 'none')
    .map(([role]) => role as any)
);
const canManageFuelExp = requireRole(
  ...Object.entries(PERMISSIONS)
    .filter(([_, p]) => p.fuelExp === 'full')
    .map(([role]) => role as any)
);

// Fuel logs
router.get('/fuel-logs', authenticate, canViewFuelExp, fuelController.getFuelLogs);
router.post('/fuel-logs', authenticate, canManageFuelExp, fuelController.createFuelLog);

// Expenses
router.get('/expenses', authenticate, canViewFuelExp, expenseController.getExpenses);
router.post('/expenses', authenticate, canManageFuelExp, expenseController.createExpense);

export default router;
