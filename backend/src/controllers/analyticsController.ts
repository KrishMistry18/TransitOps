import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAnalyticsKPIs = async (req: Request, res: Response) => {
  try {
    // Fleet Utilization
    const totalNonRetired = await prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } });
    const onTripVehicles = await prisma.vehicle.count({ where: { status: 'ON_TRIP' } });
    const fleetUtilization = totalNonRetired > 0
      ? Math.round((onTripVehicles / totalNonRetired) * 1000) / 10
      : 0.0;

    // Fuel Efficiency — fleet average: total distance / total liters
    const completedTrips = await prisma.trip.findMany({
      where: { status: 'COMPLETED', actualDistance: { not: null }, fuelConsumed: { gt: 0 } },
      select: { actualDistance: true, fuelConsumed: true },
    });

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
    const fuelCostAgg = await prisma.fuelLog.aggregate({ _sum: { cost: true } });
    const maintenanceCostAgg = await prisma.maintenanceLog.aggregate({ _sum: { cost: true } });
    const totalFuelCost = fuelCostAgg._sum.cost || 0;
    const totalMaintenanceCost = maintenanceCostAgg._sum.cost || 0;
    const operationalCost = totalFuelCost + totalMaintenanceCost;

    // Vehicle ROI — fleet average: (revenue - (maintenance + fuel)) / acquisitionCost
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'RETIRED' }, acquisitionCost: { gt: 0 } },
      select: {
        id: true,
        acquisitionCost: true,
        trips: {
          where: { status: 'COMPLETED' },
          select: { revenue: true },
        },
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
      },
    });

    let totalROI = 0;
    let roiCount = 0;
    for (const v of vehicles) {
      const revenue = v.trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
      const fuel = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
      const maint = v.maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
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
    const trips = await prisma.trip.findMany({
      where: { status: 'COMPLETED', revenue: { not: null } },
      select: { completedAt: true, revenue: true },
      orderBy: { completedAt: 'asc' },
    });

    const monthMap: Record<string, number> = {};
    for (const trip of trips) {
      if (!trip.completedAt) continue;
      const d = new Date(trip.completedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
    const vehicles = await prisma.vehicle.findMany({
      where: { status: { not: 'RETIRED' } },
      select: {
        id: true,
        registrationNumber: true,
        name: true,
        fuelLogs: { select: { cost: true } },
        maintenanceLogs: { select: { cost: true } },
      },
    });

    const ranked = vehicles.map((v) => {
      const fuelCost = v.fuelLogs.reduce((sum, f) => sum + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);
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
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: { where: { status: 'COMPLETED' }, select: { revenue: true, actualDistance: true } },
        fuelLogs: { select: { cost: true, liters: true } },
        maintenanceLogs: { select: { cost: true } },
      },
    });

    const header = 'ID,Registration,Name,Type,Status,Region,Odometer,Acquisition Cost,Total Revenue,Fuel Cost,Maintenance Cost,Operational Cost,Fuel Efficiency (km/l),ROI (%)';
    const rows = vehicles.map((v) => {
      const revenue = v.trips.reduce((s, t) => s + (t.revenue || 0), 0);
      const totalDist = v.trips.reduce((s, t) => s + (t.actualDistance || 0), 0);
      const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const totalLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      const maintCost = v.maintenanceLogs.reduce((s, m) => s + (m.cost || 0), 0);
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
