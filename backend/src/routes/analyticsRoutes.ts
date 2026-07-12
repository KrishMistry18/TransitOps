import express from 'express';
import { getAnalyticsKPIs, getMonthlyRevenue, getTopCostliestVehicles, exportCSV } from '../controllers/analyticsController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = express.Router();

router.get('/kpis', authenticate, requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), getAnalyticsKPIs);
router.get('/monthly-revenue', authenticate, requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), getMonthlyRevenue);
router.get('/top-costliest-vehicles', authenticate, requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'), getTopCostliestVehicles);
router.get('/export.csv', authenticate, requireRole('FLEET_MANAGER', 'FINANCIAL_ANALYST'), exportCSV);

export default router;
