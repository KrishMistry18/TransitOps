import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  Button, Card, Select, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, StatusChip, Modal,
} from '../components/ui';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';

interface PopulatedTrip {
  id: string;
  source: string;
  destination: string;
  cargoWeight: number;
  status: string;
  disrupted?: boolean;
  atRisk?: boolean;
  vehicle?: { id: string; registrationNumber: string; name: string };
  driver?: { id: string; name: string };
}

interface Candidate {
  vehicleId: string;
  driverId: string;
  vehicleRegistration: string;
  driverName: string;
  recoveryScore: number;
  reasons: { capacityMargin: number; regionMatch: string; safetyScore: number };
}

const DISRUPTION_TYPES = [
  { value: 'VEHICLE_BREAKDOWN', label: 'Vehicle Breakdown' },
  { value: 'EMERGENCY_MAINTENANCE', label: 'Emergency Maintenance' },
  { value: 'DRIVER_UNAVAILABLE', label: 'Driver Unavailable' },
];

export default function Recovery() {
  const { token, user } = useContext(AuthContext);
  const canManage = user?.role === 'FLEET_MANAGER';

  const [trips, setTrips] = useState<PopulatedTrip[]>([]);
  const [active, setActive] = useState<PopulatedTrip | null>(null);
  const [disruptionType, setDisruptionType] = useState('VEHICLE_BREAKDOWN');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [atRiskMsg, setAtRiskMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchTrips = async () => {
    const res = await fetch('http://localhost:5000/api/trips?status=DISPATCHED', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTrips(await res.json());
  };

  useEffect(() => { if (token) fetchTrips(); }, [token]);

  const openRecovery = (trip: PopulatedTrip) => {
    setActive(trip);
    setDisruptionType('VEHICLE_BREAKDOWN');
    setCandidates([]);
    setAtRiskMsg('');
    setError('');
  };

  // Report disruption then load ranked candidates (Req 22.1–22.6, 22.9)
  const handleReport = async () => {
    if (!active) return;
    setLoading(true);
    setError('');
    setAtRiskMsg('');
    try {
      const isVehicleEvent = disruptionType !== 'DRIVER_UNAVAILABLE';
      const targetId = isVehicleEvent ? active.vehicle?.id : active.driver?.id;
      const dRes = await fetch('http://localhost:5000/api/recovery/disruption', {
        method: 'POST', headers,
        body: JSON.stringify({ type: disruptionType, targetId }),
      });
      const dData = await dRes.json();
      if (!dRes.ok) throw new Error(dData.message || 'Failed to report disruption');

      const cRes = await fetch(`http://localhost:5000/api/recovery/candidates/${active.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cData = await cRes.json();
      if (!cRes.ok) throw new Error(cData.message || 'Failed to load candidates');

      if (cData.data.atRisk) {
        setAtRiskMsg(cData.data.message);
        setCandidates([]);
      } else {
        setCandidates(cData.data.candidates);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // One-click reassignment (Req 22.7)
  const handleReassign = async (c: Candidate) => {
    if (!active) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/recovery/reassign', {
        method: 'POST', headers,
        body: JSON.stringify({ tripId: active.id, vehicleId: c.vehicleId, driverId: c.driverId, disruptionType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reassignment failed');
      setActive(null);
      fetchTrips();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        Disruption recovery is available to Fleet Managers.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="text-accent" size={20} />
        <h2 className="text-xl font-bold text-white tracking-[0.02em]">Disruption Recovery</h2>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest">Active Dispatched Trips</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ROUTE</TableHead>
              <TableHead>VEHICLE</TableHead>
              <TableHead>DRIVER</TableHead>
              <TableHead>CARGO</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>RECOVERY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-semibold text-white text-sm">{t.source} → {t.destination}</div>
                </TableCell>
                <TableCell mono className="text-text-muted text-sm">{t.vehicle?.registrationNumber || '—'}</TableCell>
                <TableCell className="text-text-muted text-sm">{t.driver?.name || '—'}</TableCell>
                <TableCell mono className="text-text-muted text-sm">{t.cargoWeight?.toLocaleString()} kg</TableCell>
                <TableCell>
                  {t.atRisk ? <StatusChip status="AT RISK" domain="trip" /> : <StatusChip status={t.status} domain="trip" />}
                </TableCell>
                <TableCell>
                  <Button size="sm" icon={<Zap size={14} />} onClick={() => openRecovery(t)}>Recover</Button>
                </TableCell>
              </TableRow>
            ))}
            {trips.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-text-muted">No dispatched trips</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={!!active} onClose={() => setActive(null)} title={`Recover Trip: ${active?.source} → ${active?.destination}`}>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-status-danger text-sm bg-status-danger/10 rounded p-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Disruption Type</label>
              <Select value={disruptionType} onChange={(e) => setDisruptionType(e.target.value)}>
                {DISRUPTION_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </Select>
            </div>
            <Button onClick={handleReport} disabled={loading}>{loading ? 'Working…' : 'Find Replacements'}</Button>
          </div>

          {atRiskMsg && (
            <div className="flex items-center gap-2 text-status-danger text-sm bg-status-danger/10 border border-status-danger/30 rounded p-3">
              <AlertTriangle size={16} /> {atRiskMsg}
            </div>
          )}

          {candidates.length > 0 && (
            <div>
              <div className="text-[0.7rem] uppercase tracking-widest text-text-muted mb-2">Ranked Replacement Candidates</div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {candidates.map((c, i) => (
                  <div key={`${c.vehicleId}-${c.driverId}`} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.65rem] font-bold text-accent bg-accent/10 rounded px-1.5 py-0.5">#{i + 1}</span>
                        <span className="text-sm font-semibold text-white">{c.vehicleRegistration}</span>
                        <span className="text-text-muted text-sm">· {c.driverName}</span>
                      </div>
                      <div className="text-[0.7rem] text-text-muted mt-1">
                        Score <span className="text-white/80 font-semibold">{c.recoveryScore}</span> ·
                        capacity margin {c.reasons.capacityMargin.toLocaleString()} kg ·
                        {' '}{c.reasons.regionMatch} · safety {c.reasons.safetyScore}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleReassign(c)} disabled={loading}>Reassign</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
