import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { buildSimplePdf } from '../services/pdfExport.service';

const prisma = new PrismaClient();

interface VehicleReport {
  id: string;
  registrationNumber: string;
  name: string;
  status: string;
  region: string;
  totalDistance: number;
  totalFuelLiters: number;
  fuelEfficiency: number | 'N/A';
  operationalCost: number;
  revenue: number;
  roi: number | 'N/A';
}

async function buildVehicleReports(): Promise<VehicleReport[]> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      trips: { where: { status: 'COMPLETED' } },
      fuelLogs: true,
      maintenanceLogs: true,
    },
  });

  return vehicles.map((v) => {
    const totalDistance = v.trips.reduce((s, t) => s + (t.actualDistance ?? 0), 0);
    const totalFuelLiters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const totalFuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const totalMaintenanceCost = v.maintenanceLogs.reduce((s, m) => s + (m.cost ?? 0), 0);
    const revenue = v.trips.reduce((s, t) => s + (t.revenue ?? 0), 0);
    const operationalCost = totalFuelCost + totalMaintenanceCost; // Req 10.4

    // Req 10.1/10.2 — efficiency, N/A when 0 liters
    const fuelEfficiency: number | 'N/A' =
      totalFuelLiters > 0 ? Number((totalDistance / totalFuelLiters).toFixed(2)) : 'N/A';

    // Req 10.5/10.6 — ROI, N/A when acquisition cost 0
    const roi: number | 'N/A' =
      v.acquisitionCost > 0 ? Number(((revenue - operationalCost) / v.acquisitionCost).toFixed(4)) : 'N/A';

    return {
      id: v.id,
      registrationNumber: v.registrationNumber,
      name: v.name,
      status: v.status,
      region: v.region,
      totalDistance,
      totalFuelLiters,
      fuelEfficiency,
      operationalCost,
      revenue,
      roi,
    };
  });
}

// GET /api/reports/vehicles
export const getVehiclesReport = async (_req: Request, res: Response) => {
  try {
    res.json(await buildVehicleReports());
  } catch {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// GET /api/reports/fleet-utilization (Req 10.3)
export const getFleetUtilization = async (_req: Request, res: Response) => {
  try {
    const [onTrip, nonRetired] = await Promise.all([
      prisma.vehicle.count({ where: { status: 'ON_TRIP' } }),
      prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
    ]);
    const rate = nonRetired > 0 ? Number(((onTrip / nonRetired) * 100).toFixed(1)) : 0;
    res.json({ onTrip, nonRetired, rate });
  } catch {
    res.status(500).json({ error: 'Failed to compute fleet utilization' });
  }
};

const CSV_HEADERS = ['Registration Number', 'Name', 'Status', 'Region', 'Fuel Efficiency (km/L)', 'Operational Cost', 'Revenue', 'ROI'];

// GET /api/reports/vehicles/export — CSV with post-generation verification (Req 10.7, 10.9)
export const exportVehiclesCSV = async (_req: Request, res: Response) => {
  try {
    const data = await buildVehicleReports();
    const rows = data.map((v) => [
      v.registrationNumber, v.name, v.status, v.region || 'N/A',
      String(v.fuelEfficiency), String(v.operationalCost), String(v.revenue), String(v.roi),
    ]);
    const csv = [CSV_HEADERS.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    // Req 10.9 — verify content contains headers and every row before presenting as exported.
    const headerOk = csv.includes(CSV_HEADERS.join(','));
    const rowsOk = data.every((v) => csv.includes(v.registrationNumber));
    if (!headerOk || !rowsOk) {
      return res.status(500).json({ message: 'Export failed' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vehicles_report.csv"');
    res.send(csv);
  } catch {
    res.status(500).json({ message: 'Export failed' });
  }
};

// GET /api/reports/vehicles/export-pdf — PDF with post-generation verification (Req 10.8, 10.9)
export const exportVehiclesPDF = async (_req: Request, res: Response) => {
  try {
    const data = await buildVehicleReports();
    const rows = data.map((v) => [
      v.registrationNumber, v.name, v.status, v.region || 'N/A',
      String(v.fuelEfficiency), String(v.operationalCost), String(v.revenue), String(v.roi),
    ]);
    const pdf = buildSimplePdf('TransitOps — Vehicle Performance Report', CSV_HEADERS, rows);

    // Req 10.9 — verify the file was created and contains the displayed rows/headers.
    const pdfText = pdf.toString('utf-8');
    const headerOk = CSV_HEADERS.every((h) => pdfText.includes(h));
    const rowsOk = pdf.length > 0 && data.every((v) => pdfText.includes(v.registrationNumber));
    if (!headerOk || !rowsOk) {
      return res.status(500).json({ message: 'Export failed' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="vehicles_report.pdf"');
    res.send(pdf);
  } catch {
    res.status(500).json({ message: 'Export failed' });
  }
};
