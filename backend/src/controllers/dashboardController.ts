import { Request, Response } from 'express';
import { db } from '../config/dbService';

export const getDashboardKPIs = async (req: Request, res: Response) => {
  try {
    const vehicles = db.getVehicles();
    const trips = db.getTrips();
    const drivers = db.getDrivers();

    const activeVehicles = vehicles.filter(v => v.status !== 'RETIRED').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const inMaintenance = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
    const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;
    const driversOnDuty = drivers.filter(d => d.status === 'ON_TRIP').length;
    
    const totalNonRetired = activeVehicles;
    const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;

    const fleetUtilizationPct = totalNonRetired > 0
      ? Math.round((onTripVehicles / totalNonRetired) * 1000) / 10
      : 0.0;

    res.json({
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilizationPct,
      atRiskTrips: 0,       // Placeholder
      recoveredTrips: 0,    // Placeholder
    });
  } catch (error) {
    console.error('Dashboard KPI error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard KPIs' });
  }
};

export const getRecentTrips = async (req: Request, res: Response) => {
  try {
    const trips = db.getTrips();
    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    // Sort by id descending, take 6
    const sortedTrips = [...trips].sort((a, b) => b.id - a.id).slice(0, 6);

    const formatted = sortedTrips.map((t) => {
      const v = vehicles.find(veh => veh.id === t.vehicleId) || { name: 'Unknown', registrationNumber: 'N/A' };
      const d = drivers.find(drv => drv.id === t.driverId) || { name: 'Unknown' };

      return {
        id: t.id,
        tripCode: `TR${String(t.id).padStart(3, '0')}`,
        vehicle: v.name,
        vehicleReg: v.registrationNumber,
        driver: d.name,
        source: t.source,
        destination: t.destination,
        status: t.status,
        dispatchedAt: t.dispatchedAt,
        completedAt: t.completedAt,
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Recent trips error:', error);
    res.status(500).json({ message: 'Failed to fetch recent trips' });
  }
};

export const getVehicleStatusDistribution = async (req: Request, res: Response) => {
  try {
    const vehicles = db.getVehicles();
    const statusCounts: Record<string, number> = {};
    
    // Initialize standard statuses to make sure they are present
    statusCounts['AVAILABLE'] = 0;
    statusCounts['ON_TRIP'] = 0;
    statusCounts['IN_SHOP'] = 0;
    statusCounts['RETIRED'] = 0;

    for (const v of vehicles) {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1;
    }

    const distribution = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));

    res.json(distribution);
  } catch (error) {
    console.error('Vehicle status distribution error:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle status distribution' });
  }
};
