import React, { useState, useEffect, useContext } from 'react';
import { FuelLog, Vehicle } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import {
  Button, Card, Input, Select, Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell, StatusChip, Modal
} from '../components/ui';
import { Plus, Fuel as FuelIcon, AlertTriangle, Activity, DollarSign, Info } from 'lucide-react';

type FuelLogPopulated = FuelLog & {
  vehicle?: Pick<Vehicle, 'id' | 'name' | 'registrationNumber'> | null;
};

interface FuelStats {
  totalLogs: number;
  flaggedCount: number;
  avgEfficiency: number;
  totalSpend: number;
}

export default function Fuel() {
  const { token, user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ADMIN';
  const canManage = isAdmin || user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';
  const canView = isAdmin || user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';

  const [fuelLogs, setFuelLogs] = useState<FuelLogPopulated[]>([]);
  const [stats, setStats] = useState<FuelStats>({ totalLogs: 0, flaggedCount: 0, avgEfficiency: 0, totalSpend: 0 });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    vehicleId: '',
    tripId: '',
    liters: '',
    cost: '',
    date: new Date().toISOString().slice(0, 16), // datetime-local format
    distance: '',
  });
  const [formError, setFormError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    const [logsRes, statsRes, vRes] = await Promise.all([
      fetch(`http://localhost:5000/api/fuel-logs?flaggedOnly=${showFlaggedOnly}`, { headers }),
      fetch('http://localhost:5000/api/fuel-logs/stats', { headers }),
      fetch('http://localhost:5000/api/vehicles', { headers }),
    ]);
    if (logsRes.ok) setFuelLogs(await logsRes.json());
    if (statsRes.ok) setStats(await statsRes.json());
    if (vRes.ok) setVehicles(await vRes.json());
  };

  useEffect(() => { fetchData(); }, [token, showFlaggedOnly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    const payload: any = {
      vehicleId: form.vehicleId,
      liters: Number(form.liters),
      cost: Number(form.cost),
      date: form.date ? new Date(form.date).toISOString() : undefined,
    };
    if (form.tripId.trim()) payload.tripId = form.tripId.trim();
    if (form.distance.trim()) payload.distance = Number(form.distance);

    try {
      const res = await fetch('http://localhost:5000/api/fuel-logs', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setFormError(data.message || 'Failed to save fuel log');

      setShowModal(false);
      setForm({ vehicleId: '', tripId: '', liters: '', cost: '', date: new Date().toISOString().slice(0, 16), distance: '' });
      setSuccessMsg('Fuel log saved successfully.');
      fetchData();

      // Clear success message after 5s
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setFormError('Network error');
    }
  };

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        You don't have permission to view fuel & expenses.
      </div>
    );
  }

  const statCards = [
    {
      label: 'FUEL LOGS',
      value: stats.totalLogs.toString(),
      color: 'bg-accent-primary',
    },
    {
      label: 'FLAGGED',
      value: stats.flaggedCount.toString(),
      color: stats.flaggedCount > 0 ? 'bg-status-danger' : 'bg-accent-primary',
    },
    {
      label: 'AVERAGE EFFICIENCY',
      value: `${stats.avgEfficiency} km/L`,
      color: 'bg-emerald-500',
    },
    {
      label: 'FUEL SPEND',
      value: `$${stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      color: stats.totalSpend > 10000 ? 'bg-status-danger' : 'bg-accent-primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ═══ Hero section ═══ */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0d1b2a] via-[#1b2838] to-[#0d1b2a] border border-white/[0.06] p-8">
        {/* Decorative grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-[0.1em] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-4">
              Fuel Intelligence Board
            </span>
            <h1 className="text-[1.75rem] font-semibold text-white leading-tight tracking-tight max-w-xl">
              Track fuel fills and surface anomalies in real time.
            </h1>
            <p className="text-sm text-text-muted mt-2 max-w-lg leading-relaxed">
              Log fill-ups, attach optional trip context, and let the anomaly model flag efficiency
              drops automatically.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <code className="px-2 py-1 rounded bg-white/[0.06] border border-white/[0.08] text-[0.7rem] font-mono text-text-muted">
                Live API: /api/fuel-logs
              </code>
              <code className="px-2 py-1 rounded bg-white/[0.06] border border-white/[0.08] text-[0.7rem] font-mono text-text-muted">
                Flags: efficiency drift
              </code>
            </div>
          </div>

          {canManage && (
            <Button
              icon={<Plus size={14} />}
              onClick={() => { setShowModal(true); setFormError(''); setSuccessMsg(''); }}
              className="shrink-0"
            >
              New fuel log
            </Button>
          )}
        </div>
      </div>

      {/* ═══ Stats cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, color }) => (
          <div
            key={label}
            className="relative overflow-hidden rounded-lg border border-white/[0.06] bg-surface p-5"
          >
            {/* Top colored bar */}
            <div className={`absolute top-0 left-0 right-0 h-[3px] ${color}`} />
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-text-muted mb-2">
              {label}
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ═══ Fuel logs section ═══ */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Fuel logs</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Review every refuel record and inspect anomaly flags generated from your backend service.
            </p>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-lg overflow-hidden">
            <button
              onClick={() => setShowFlaggedOnly(false)}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                !showFlaggedOnly
                  ? 'bg-white/[0.1] text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              All logs
            </button>
            <button
              onClick={() => setShowFlaggedOnly(true)}
              className={`px-4 py-1.5 text-sm font-medium transition-all ${
                showFlaggedOnly
                  ? 'bg-white/[0.1] text-white'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              Flagged only
            </button>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="px-4 py-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm font-medium">
            {successMsg}
          </div>
        )}

        {/* Logs table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VEHICLE</TableHead>
                <TableHead>TRIP</TableHead>
                <TableHead>LITERS</TableHead>
                <TableHead>COST</TableHead>
                <TableHead>EFFICIENCY</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>LOGGED AT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fuelLogs.map(log => {
                const isFlagged = log.anomalyFlag;
                return (
                  <TableRow key={log.id} className={isFlagged ? 'bg-status-danger/[0.04]' : ''}>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {log.vehicle?.name || `Vehicle ${log.vehicleId.slice(-5)}`}
                        </div>
                        <div className="text-[0.65rem] text-text-muted font-mono">
                          {log.vehicle?.registrationNumber || 'Unknown vehicle'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell mono className="text-text-muted text-xs">
                      {log.tripId ? log.tripId.slice(-5) : '—'}
                    </TableCell>
                    <TableCell mono className="text-text-muted">
                      {log.liters.toFixed(1)} L
                    </TableCell>
                    <TableCell mono className="text-text-muted">
                      ${log.cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {log.impliedEfficiency != null && log.impliedEfficiency > 0 ? (
                        <div>
                          <div className={`text-sm font-medium ${isFlagged ? 'text-status-danger' : 'text-white'}`}>
                            {log.impliedEfficiency.toFixed(1)} km/L
                          </div>
                          <div className="text-[0.6rem] text-text-muted truncate max-w-[180px]" title={log.anomalyReason || undefined}>
                            {isFlagged
                              ? log.anomalyReason || 'Anomaly detected'
                              : 'Baseline normal'
                            }
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-text-muted">—</div>
                          <div className="text-[0.6rem] text-text-muted">Baseline normal</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isFlagged ? (
                        <StatusChip status="CANCELLED" />
                      ) : (
                        <StatusChip status="COMPLETED" />
                      )}
                    </TableCell>
                    <TableCell mono className="text-text-muted text-xs">
                      {new Date(log.date).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}, {new Date(log.date).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
              {fuelLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-text-muted">
                    {showFlaggedOnly
                      ? 'No flagged fuel logs found — all refueling looks normal.'
                      : 'No fuel logs recorded yet.'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ═══ Record fuel log modal ═══ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Record fuel log">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="text-status-danger text-sm bg-status-danger/10 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Vehicle ID</label>
              <Select
                required
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}
              >
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Trip ID (optional)</label>
              <Input
                value={form.tripId}
                onChange={e => setForm({ ...form, tripId: e.target.value })}
                placeholder="64b9f ..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Liters</label>
              <Input
                type="number"
                required
                min="0"
                step="0.1"
                value={form.liters}
                onChange={e => setForm({ ...form, liters: e.target.value })}
                placeholder="86"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Cost</label>
              <Input
                type="number"
                required
                min="0"
                step="0.01"
                value={form.cost}
                onChange={e => setForm({ ...form, cost: e.target.value })}
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Date & time</label>
              <Input
                type="datetime-local"
                required
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Distance for anomaly check (km)</label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={form.distance}
                onChange={e => setForm({ ...form, distance: e.target.value })}
                placeholder="510"
              />
            </div>
          </div>

          {/* Info callout */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
            <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[0.8rem] text-amber-200/80 leading-relaxed">
              If you enter distance, the backend will calculate implied efficiency and potentially
              flag the log against the vehicle baseline.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" icon={<Plus size={14} />}>Save log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
