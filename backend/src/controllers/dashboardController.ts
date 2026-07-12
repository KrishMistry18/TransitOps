import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardKPIs = async (req: Request, res: Response) => {
  try {
    const [
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      totalNonRetired,
      onTripVehicles,
    ] = await Promise.all([
      prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.driver.count({ where: { status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
    ]);

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
      atRiskTrips: 0,       // Placeholder — wired when disruption recovery is built
      recoveredTrips: 0,    // Placeholder — wired when disruption recovery is built
    });
  } catch (error) {
    console.error('Dashboard KPI error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard KPIs' });
  }
};

export const getRecentTrips = async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      take: 6,
      orderBy: { id: 'desc' },
      include: {
        vehicle: { select: { name: true, registrationNumber: true } },
        driver: { select: { name: true } },
      },
    });

    const formatted = trips.map((t) => ({
      id: t.id,
      tripCode: `TR${String(t.id).padStart(3, '0')}`,
      vehicle: t.vehicle.name,
      vehicleReg: t.vehicle.registrationNumber,
      driver: t.driver.name,
      source: t.source,
      destination: t.destination,
      status: t.status,
      dispatchedAt: t.dispatchedAt,
      completedAt: t.completedAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Recent trips error:', error);
    res.status(500).json({ message: 'Failed to fetch recent trips' });
  }
};

export const getVehicleStatusDistribution = async (req: Request, res: Response) => {
  try {
    const statuses = await prisma.vehicle.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const distribution = statuses.map((s) => ({
      status: s.status,
      count: s._count.id,
    }));

    res.json(distribution);
  } catch (error) {
    console.error('Vehicle status distribution error:', error);
    res.status(500).json({ message: 'Failed to fetch vehicle status distribution' });
  }
};
