import { Request, Response } from 'express';
import { db } from '../config/dbService';

export const getAnalyticsKPIs = async (req: Request, res: Response) => {
  try {
    const vehicles = db.getVehicles();
    const trips = db.getTrips();
    const fuelLogs = db.getFuelLogs();
    const maintenanceLogs = db.getMaintenanceLogs();

    // Fleet Utilization
    const totalNonRetired = vehicles.filter(v => v.status !== 'RETIRED').length;
    const onTripVehicles = vehicles.filter(v => v.status === 'ON_TRIP').length;
    const fleetUtilization = totalNonRetired > 0
      ? Math.round((onTripVehicles / totalNonRetired) * 1000) / 10
      : 0.0;

    // Fuel Efficiency — fleet average: total distance / total liters
    const completedTrips = trips.filter(t => t.status === 'COMPLETED' && t.actualDistance && t.actualDistance > 0 && t.fuelConsumed && t.fuelConsumed > 0);

    let totalDistance = 0;
    let totalFuel = 0;
    for (const trip of completedTrips) {
      totalDistance += trip.actualDistance || 0;
      totalFuel += trip.fuelConsumed || 0;
    }
    const fuelEfficiency = totalFuel > 0
      ? Math.round((totalDistance / totalFuel) * 10) / 10
      : null; // N/A

    // Operational Cost — sum of fuel + maintenance costs
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
    const operationalCost = totalFuelCost + totalMaintenanceCost;

    // Vehicle ROI — fleet average: (revenue - (maintenance + fuel)) / acquisitionCost
    const activeVehiclesList = vehicles.filter(v => v.status !== 'RETIRED' && v.acquisitionCost && v.acquisitionCost > 0);

    let totalROI = 0;
    let roiCount = 0;
    for (const v of activeVehiclesList) {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'COMPLETED');
      const vFuelLogs = fuelLogs.filter(f => f.vehicleId === v.id);
      const vMaintLogs = maintenanceLogs.filter(m => m.vehicleId === v.id);

      const revenue = vTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const fuel = vFuelLogs.reduce((sum, f) => sum + f.cost, 0);
      const maint = vMaintLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
      const roi = (revenue - (maint + fuel)) / v.acquisitionCost;
      totalROI += roi;
      roiCount++;
    }
    const vehicleROI = roiCount > 0
      ? Math.round((totalROI / roiCount) * 1000) / 10
      : null; // N/A

    res.json({
      fuelEfficiency,     // km/l or null
      fleetUtilization,   // %
      operationalCost,    // total $
      vehicleROI,         // avg % or null
    });
  } catch (error) {
    console.error('Analytics KPI error:', error);
    res.status(500).json({ message: 'Failed to fetch analytics KPIs' });
  }
};

export const getMonthlyRevenue = async (req: Request, res: Response) => {
  try {
    const trips = db.getTrips().filter(t => t.status === 'COMPLETED' && t.revenue !== null && t.completedAt);
    
    // Sort completed trips by completedAt ascending
    trips.sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    const monthMap: Record<string, number> = {};
    for (const trip of trips) {
      if (!trip.completedAt) continue;
      const d = new Date(trip.completedAt);
      const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      monthMap[label] = (monthMap[label] || 0) + (trip.revenue || 0);
    }

    const result = Object.entries(monthMap).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
    }));

    // If no data, return sample months with 0
    if (result.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return res.json(months.map(m => ({ month: m, revenue: 0 })));
    }

    res.json(result);
  } catch (error) {
    console.error('Monthly revenue error:', error);
    res.status(500).json({ message: 'Failed to fetch monthly revenue' });
  }
};

export const getTopCostliestVehicles = async (req: Request, res: Response) => {
  try {
    const vehicles = db.getVehicles().filter(v => v.status !== 'RETIRED');
    const fuelLogs = db.getFuelLogs();
    const maintenanceLogs = db.getMaintenanceLogs();

    const ranked = vehicles.map((v) => {
      const vFuel = fuelLogs.filter(f => f.vehicleId === v.id);
      const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id);

      const fuelCost = vFuel.reduce((sum, f) => sum + f.cost, 0);
      const maintenanceCost = vMaint.reduce((sum, m) => sum + (m.cost || 0), 0);
      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        fuelCost: Math.round(fuelCost),
        maintenanceCost: Math.round(maintenanceCost),
        totalCost: Math.round(fuelCost + maintenanceCost),
      };
    });

    ranked.sort((a, b) => b.totalCost - a.totalCost);
    res.json(ranked.slice(0, 5));
  } catch (error) {
    console.error('Top costliest vehicles error:', error);
    res.status(500).json({ message: 'Failed to fetch top costliest vehicles' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const vehicles = db.getVehicles();
    const trips = db.getTrips();
    const fuelLogs = db.getFuelLogs();
    const maintenanceLogs = db.getMaintenanceLogs();

    const header = 'ID,Registration,Name,Type,Status,Region,Odometer,Acquisition Cost,Total Revenue,Fuel Cost,Maintenance Cost,Operational Cost,Fuel Efficiency (km/l),ROI (%)';
    const rows = vehicles.map((v) => {
      const vTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'COMPLETED');
      const vFuel = fuelLogs.filter(f => f.vehicleId === v.id);
      const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id);

      const revenue = vTrips.reduce((s, t) => s + (t.revenue || 0), 0);
      const totalDist = vTrips.reduce((s, t) => s + (t.actualDistance || 0), 0);
      const fuelCost = vFuel.reduce((s, f) => s + f.cost, 0);
      const totalLiters = vFuel.reduce((s, f) => s + f.liters, 0);
      const maintCost = vMaint.reduce((s, m) => s + (m.cost || 0), 0);
      const opCost = fuelCost + maintCost;
      const fuelEff = totalLiters > 0 ? (totalDist / totalLiters).toFixed(1) : 'N/A';
      const roi = v.acquisitionCost > 0
        ? (((revenue - opCost) / v.acquisitionCost) * 100).toFixed(1)
        : 'N/A';

      return [
        v.id,
        `"${v.registrationNumber}"`,
        `"${v.name}"`,
        `"${v.type}"`,
        v.status,
        `"${v.region}"`,
        v.odometer,
        v.acquisitionCost,
        revenue.toFixed(2),
        fuelCost.toFixed(2),
        maintCost.toFixed(2),
        opCost.toFixed(2),
        fuelEff,
        roi,
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fleet-analytics-report.csv"');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
};
