import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MIN_HISTORY_FOR_BASELINE = 2;
const DEVIATION_THRESHOLD_PCT = 40; // flag if efficiency drops >40% below baseline
const SPIKE_MULTIPLIER = 1.8; // flag if cost-per-liter or liters jump ≥1.8× vs median

export interface AnomalyResult {
  efficiency: number;
  baseline?: number;
  flagged: boolean;
  reason?: string;
}

/**
 * Checks a new fuel log for anomalies against the vehicle's historical data.
 *
 * Anomaly signals (any one triggers a flag):
 *   1. Efficiency drift — implied km/L drops significantly below the rolling baseline.
 *   2. Consumption spike — liters jump ≥1.8× vs the median of recent fills.
 *   3. Cost spike — cost-per-liter jumps ≥1.8× vs the median.
 *   4. Linearity violation — distance and liters should scale roughly linearly;
 *      if one doubles but the other doesn't change proportionally, flag it.
 */
export async function checkFuelAnomaly(
  vehicleId: string,
  distance: number,
  litersUsed: number,
  cost?: number
): Promise<AnomalyResult> {
  const efficiency = distance / litersUsed; // km/L

  const history = await prisma.fuelLog.findMany({
    where: { vehicleId },
    orderBy: { date: 'desc' },
    take: 20,
  });

  if (history.length < MIN_HISTORY_FOR_BASELINE) {
    return { efficiency, flagged: false }; // not enough data — baseline normal
  }

  const reasons: string[] = [];

  // ── 1) Efficiency drift (only if we have logs WITH efficiency) ──
  const withEfficiency = history.filter(h => h.impliedEfficiency != null && h.impliedEfficiency > 0);
  let baseline: number | undefined;

  if (withEfficiency.length >= MIN_HISTORY_FOR_BASELINE) {
    baseline = withEfficiency.reduce((sum, h) => sum + (h.impliedEfficiency ?? 0), 0) / withEfficiency.length;
    const deviationPct = ((baseline - efficiency) / baseline) * 100;

    if (deviationPct > DEVIATION_THRESHOLD_PCT) {
      reasons.push(
        `Efficiency ${efficiency.toFixed(1)} km/L is ${deviationPct.toFixed(0)}% below baseline ${baseline.toFixed(1)} km/L`
      );
    }
  }

  // ── 2) Consumption spike — liters vs historical median ──
  const historicalLiters = history.map(h => h.liters).sort((a, b) => a - b);
  const medianLiters = historicalLiters[Math.floor(historicalLiters.length / 2)];
  if (medianLiters > 0 && litersUsed >= medianLiters * SPIKE_MULTIPLIER) {
    reasons.push(
      `Fuel volume ${litersUsed.toFixed(1)}L is ${(litersUsed / medianLiters).toFixed(1)}× the median ${medianLiters.toFixed(1)}L`
    );
  }

  // ── 3) Cost spike — cost-per-liter vs historical median ──
  if (cost != null && cost > 0) {
    const costPerLiter = cost / litersUsed;
    const historicalCPL = history
      .filter(h => h.cost > 0 && h.liters > 0)
      .map(h => h.cost / h.liters)
      .sort((a, b) => a - b);

    if (historicalCPL.length >= MIN_HISTORY_FOR_BASELINE) {
      const medianCPL = historicalCPL[Math.floor(historicalCPL.length / 2)];
      if (medianCPL > 0 && costPerLiter >= medianCPL * SPIKE_MULTIPLIER) {
        reasons.push(
          `Cost/L ₹${costPerLiter.toFixed(1)} is ${(costPerLiter / medianCPL).toFixed(1)}× the median ₹${medianCPL.toFixed(1)}`
        );
      }
    }
  }

  // ── 4) Linearity violation — distance vs liters should scale together ──
  if (withEfficiency.length >= MIN_HISTORY_FOR_BASELINE && baseline && baseline > 0) {
    const expectedLiters = distance / baseline;
    const ratio = litersUsed / expectedLiters;
    // If actual liters are ≥2× or ≤0.5× the expected amount, the relationship is non-linear
    if (ratio >= 2.0) {
      reasons.push(
        `Non-linear: used ${litersUsed.toFixed(0)}L for ${distance.toFixed(0)}km — expected ~${expectedLiters.toFixed(0)}L (${ratio.toFixed(1)}× expected)`
      );
    } else if (ratio <= 0.4) {
      reasons.push(
        `Non-linear: used only ${litersUsed.toFixed(0)}L for ${distance.toFixed(0)}km — expected ~${expectedLiters.toFixed(0)}L (suspiciously low)`
      );
    }
  }

  const flagged = reasons.length > 0;

  return {
    efficiency,
    baseline,
    flagged,
    reason: flagged ? reasons.join(' · ') : undefined,
  };
}