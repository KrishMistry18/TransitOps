import express from 'express';
import { getDashboardKPIs, getRecentTrips, getVehicleStatusDistribution } from '../controllers/dashboardController';

const router = express.Router();

router.get('/kpis', getDashboardKPIs);
router.get('/recent-trips', getRecentTrips);
router.get('/vehicle-status', getVehicleStatusDistribution);

export default router;
