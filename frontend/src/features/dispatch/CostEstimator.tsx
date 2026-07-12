import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Calculator } from 'lucide-react';

interface EstimateData {
  fuelEfficiency: number | 'N/A';
  fuelPrice: number;
  estimatedFuelCost: number | 'N/A';
  estimatedMargin: number | 'N/A';
}

interface Props {
  vehicleId?: string;
  plannedDistance?: number;
  revenue?: number;
}

/**
 * Trip cost & ROI estimator (Req 17). Shows estimated fuel cost from the vehicle's
 * historical efficiency + configured fuel price, and margin against expected revenue.
 */
export default function CostEstimator({ vehicleId, plannedDistance, revenue }: Props) {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState<EstimateData | null>(null);

  useEffect(() => {
    if (!vehicleId || !plannedDistance || plannedDistance <= 0) {
      setData(null);
      return;
    }
    const params = new URLSearchParams({ vehicleId, plannedDistance: String(plannedDistance) });
    if (revenue) params.append('revenue', String(revenue));

    fetch(`http://localhost:5000/api/trips/estimate?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => setData(res?.data ?? null))
      .catch(() => setData(null));
  }, [token, vehicleId, plannedDistance, revenue]);

  if (!data) return null;

  const fmt = (v: number | 'N/A') => (v === 'N/A' ? 'N/A' : `₹${v.toLocaleString()}`);

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted mb-2">
        <Calculator size={12} className="text-accent" /> Trip Estimate
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[0.6rem] text-text-muted uppercase">Efficiency</div>
          <div className="text-sm font-semibold text-white">{data.fuelEfficiency === 'N/A' ? 'N/A' : `${data.fuelEfficiency} km/L`}</div>
        </div>
        <div>
          <div className="text-[0.6rem] text-text-muted uppercase">Est. Fuel Cost</div>
          <div className="text-sm font-semibold text-status-pending">{fmt(data.estimatedFuelCost)}</div>
        </div>
        <div>
          <div className="text-[0.6rem] text-text-muted uppercase">Est. Margin</div>
          <div className={data.estimatedMargin !== 'N/A' && data.estimatedMargin >= 0 ? 'text-sm font-semibold text-status-available' : 'text-sm font-semibold text-status-danger'}>
            {fmt(data.estimatedMargin)}
          </div>
        </div>
      </div>
    </div>
  );
}
