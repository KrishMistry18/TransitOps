import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface Ineligible {
  id: string;
  registrationNumber?: string;
  name?: string;
  reasons: string[];
}

interface EligibilityData {
  ineligibleVehicles: Ineligible[];
  ineligibleDrivers: Ineligible[];
  capacityWarning: string | null;
  eligibleForDispatch: boolean | null;
}

interface Props {
  cargoWeight?: number;
  vehicleId?: string;
  driverId?: string;
}

/**
 * Live dispatch eligibility panel (Req 16). Lists every ineligible vehicle/driver with
 * the reason it can't be selected, surfaces a capacity warning, and shows a dispatch-ready
 * verdict when a specific vehicle+driver+cargo are chosen.
 */
export default function EligibilityPanel({ cargoWeight, vehicleId, driverId }: Props) {
  const { token } = useContext(AuthContext);
  const [data, setData] = useState<EligibilityData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (cargoWeight) params.append('cargoWeight', String(cargoWeight));
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (driverId) params.append('driverId', driverId);

    fetch(`http://localhost:5000/api/trips/eligibility?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => setData(res?.data ?? null))
      .catch(() => setData(null));
  }, [token, cargoWeight, vehicleId, driverId]);

  if (!data) return null;

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2">
      <div className="text-[0.7rem] font-semibold uppercase tracking-widest text-text-muted">Eligibility</div>

      {data.eligibleForDispatch === true && !data.capacityWarning && (
        <div className="flex items-center gap-2 text-status-available text-[0.75rem]">
          <CheckCircle2 size={14} /> Ready to dispatch — selected vehicle and driver are eligible
        </div>
      )}
      {data.capacityWarning && (
        <div className="flex items-center gap-2 text-status-danger text-[0.75rem]">
          <AlertTriangle size={14} /> {data.capacityWarning}
        </div>
      )}

      {(data.ineligibleVehicles.length > 0 || data.ineligibleDrivers.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <div className="text-[0.65rem] uppercase tracking-widest text-text-muted mb-1">Unavailable vehicles</div>
            <ul className="space-y-1">
              {data.ineligibleVehicles.slice(0, 6).map((v) => (
                <li key={v.id} className="flex items-start gap-1.5 text-[0.7rem] text-text-muted">
                  <XCircle size={12} className="text-status-danger mt-0.5 shrink-0" />
                  <span><span className="text-white/80">{v.registrationNumber || v.name}</span> — {v.reasons.join('; ')}</span>
                </li>
              ))}
              {data.ineligibleVehicles.length === 0 && <li className="text-[0.7rem] text-text-muted">None</li>}
            </ul>
          </div>
          <div>
            <div className="text-[0.65rem] uppercase tracking-widest text-text-muted mb-1">Unavailable drivers</div>
            <ul className="space-y-1">
              {data.ineligibleDrivers.slice(0, 6).map((d) => (
                <li key={d.id} className="flex items-start gap-1.5 text-[0.7rem] text-text-muted">
                  <XCircle size={12} className="text-status-danger mt-0.5 shrink-0" />
                  <span><span className="text-white/80">{d.name}</span> — {d.reasons.join('; ')}</span>
                </li>
              ))}
              {data.ineligibleDrivers.length === 0 && <li className="text-[0.7rem] text-text-muted">None</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
