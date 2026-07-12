import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIN_HISTORY_FOR_BASELINE = 3;
const DEVIATION_THRESHOLD_PCT = 25; 

export interface AnomalyResult {
  efficiency: number;
  baseline?: number;
  flagged: boolean;
  reason?: string;
}

export async function checkFuelAnomaly(
  vehicleId: string,
  distance: number,
  litersUsed: number
): Promise<AnomalyResult> {
  const efficiency = distance / litersUsed; 

  const history = await prisma.fuelLog.findMany({
    where: { vehicleId, impliedEfficiency: { not: null } },
    orderBy: { date: 'desc' },
    take: 10,
  });

  if (history.length < MIN_HISTORY_FOR_BASELINE) {
    return { efficiency, flagged: false }; 
  }

  const baseline = history.reduce((sum, h) => sum + (h.impliedEfficiency ?? 0), 0) / history.length;
  const deviationPct = ((baseline - efficiency) / baseline) * 100;

  if (deviationPct > DEVIATION_THRESHOLD_PCT) {
    return {
      efficiency,
      baseline,
      flagged: true,
      reason: `Efficiency ${efficiency.toFixed(1)} km/l is ${deviationPct.toFixed(0)}% below this vehicle's baseline of ${baseline.toFixed(1)} km/l`,
    };
  }

  return { efficiency, baseline, flagged: false };
}