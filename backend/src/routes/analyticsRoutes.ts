import express from 'express';
import { getAnalyticsKPIs, getMonthlyRevenue, getTopCostliestVehicles, exportCSV } from '../controllers/analyticsController';

const router = express.Router();

router.get('/kpis', getAnalyticsKPIs);
router.get('/monthly-revenue', getMonthlyRevenue);
router.get('/top-costliest-vehicles', getTopCostliestVehicles);
router.get('/export.csv', exportCSV);

export default router;
