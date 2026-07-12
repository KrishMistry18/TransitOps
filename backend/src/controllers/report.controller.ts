import { Request, Response } from 'express';
import { VehicleModel } from '../models/Vehicle';

const getVehicleAnalyticsPipeline = () => {
  return [
    {
      $lookup: {
        from: 'trips',
        localField: '_id',
        foreignField: 'vehicle',
        as: 'trips'
      }
    },
    {
      $lookup: {
        from: 'fuellogs',
        localField: '_id',
        foreignField: 'vehicle',
        as: 'fuelLogs'
      }
    },
    {
      $lookup: {
        from: 'maintenancelogs',
        localField: '_id',
        foreignField: 'vehicle',
        as: 'maintenanceLogs'
      }
    },
    {
      $addFields: {
        totalDistance: {
          $sum: {
            $map: {
              input: { $filter: { input: '$trips', as: 'trip', cond: { $eq: ['$$trip.status', 'COMPLETED'] } } },
              as: 't',
              in: { $ifNull: ['$$t.actualDistance', 0] }
            }
          }
        },
        totalFuelLiters: {
          $sum: '$fuelLogs.liters'
        },
        totalFuelCost: {
          $sum: '$fuelLogs.cost'
        },
        totalMaintenanceCost: {
          $sum: '$maintenanceLogs.cost'
        },
        totalRevenue: {
          $sum: {
            $map: {
              input: { $filter: { input: '$trips', as: 'trip', cond: { $eq: ['$$trip.status', 'COMPLETED'] } } },
              as: 't',
              in: { $ifNull: ['$$t.revenue', 0] }
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 1,
        registrationNumber: 1,
        name: 1,
        status: 1,
        region: 1,
        acquisitionCost: 1,
        totalDistance: 1,
        totalFuelLiters: 1,
        operationalCost: { $add: ['$totalFuelCost', '$totalMaintenanceCost'] },
        revenue: '$totalRevenue'
      }
    }
  ];
};

const computeDerivedMetrics = (vehicle: any) => {
  const fuelEfficiency = vehicle.totalFuelLiters > 0 
    ? (vehicle.totalDistance / vehicle.totalFuelLiters).toFixed(2) 
    : "N/A";
    
  const roi = vehicle.acquisitionCost > 0 
    ? ((vehicle.revenue - vehicle.operationalCost) / vehicle.acquisitionCost).toFixed(4)
    : "N/A";

  return {
    id: vehicle._id,
    registrationNumber: vehicle.registrationNumber,
    name: vehicle.name,
    status: vehicle.status,
    region: vehicle.region,
    fuelEfficiency,
    operationalCost: vehicle.operationalCost,
    revenue: vehicle.revenue,
    roi
  };
};

export const getVehiclesReport = async (req: Request, res: Response) => {
  try {
    const rawData = await VehicleModel.aggregate(getVehicleAnalyticsPipeline());
    const data = rawData.map(computeDerivedMetrics);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const exportVehiclesCSV = async (req: Request, res: Response) => {
  try {
    const rawData = await VehicleModel.aggregate(getVehicleAnalyticsPipeline());
    const data = rawData.map(computeDerivedMetrics);

    const headers = ['Registration Number', 'Name', 'Status', 'Region', 'Fuel Efficiency (km/L)', 'Operational Cost', 'Revenue', 'ROI'];
    const rows = data.map(v => [
      v.registrationNumber,
      v.name,
      v.status,
      v.region || 'N/A',
      v.fuelEfficiency,
      v.operationalCost,
      v.revenue,
      v.roi
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vehicles_report.csv"');
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
};
