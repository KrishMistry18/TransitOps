import React, { useState, useEffect, useContext } from 'react';
import { Trip, Vehicle, Driver } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import {
  Button, Card, Input, Select, Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell, StatusChip, Modal
} from '../components/ui';
import { Plus, Send, CheckCircle, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '../components/ui/utils';
import EligibilityPanel from '../features/dispatch/EligibilityPanel';
import CostEstimator from '../features/dispatch/CostEstimator';
import { useDemo } from '../features/demo/DemoContext';

type TripWithPopulated = Omit<Trip, 'vehicleId' | 'driverId'> & {
  vehicle?: Vehicle;
  driver?: Driver;
  vehicleId?: string;
  driverId?: string;
  cancelledAt?: Date | string;
};

const STEPS = ['DRAFT', 'DISPATCHED', 'COMPLETED'] as const;

function TripStepper({ status }: { status: string }) {
  const isCancelled = status === 'CANCELLED';
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const isActive = status === step;
        const isPast = STEPS.indexOf(status as any) > i && !isCancelled;
        return (
          <React.Fragment key={step}>
            <div className={cn(
              'px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-widest transition-all',
              isPast ? 'bg-status-available/20 text-status-available' :
              isActive && !isCancelled ? 'bg-accent/20 text-accent ring-1 ring-accent' :
              'bg-white/5 text-text-muted'
            )}>
              {step}
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight size={10} className={cn('text-text-muted', isPast && 'text-status-available')} />
            )}
          </React.Fragment>
        );
      })}
      {isCancelled && (
        <div className="ml-1 px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-widest bg-status-danger/20 text-status-danger">
          CANCELLED
        </div>
      )}
    </div>
  );
}

export default function Trips() {
  const { token, user } = useContext(AuthContext);
  const { completeStep } = useDemo();
  const canManage = user?.role === 'DRIVER'; // trips:full — Driver_Role (Req 2.7)

  const [trips, setTrips] = useState<TripWithPopulated[]>([]);
  const [availVehicles, setAvailVehicles] = useState<Vehicle[]>([]);
  const [availDrivers, setAvailDrivers] = useState<Driver[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showComplete, setShowComplete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [form, setForm] = useState({
    source: '', destination: '', vehicleId: '', driverId: '',
    cargoWeight: '', plannedDistance: '', expectedRevenue: ''
  });
  const [completeForm, setCompleteForm] = useState({ finalOdometer: '', fuelConsumed: '', actualDistance: '' });

  // Capacity warning
  const selectedVehicle = availVehicles.find(v => v.id === form.vehicleId);
  const cargoNum = Number(form.cargoWeight);
  const overCapacity = selectedVehicle && cargoNum > 0 && cargoNum > selectedVehicle.maxLoadCapacity;

  const headers = { Authorization: `Bearer ${token}` };

  const fetchTrips = async () => {
    const res = await fetch('http://localhost:5000/api/trips', { headers });
    if (res.ok) setTrips(await res.json());
  };

  const fetchAvailable = async () => {
    const [vRes, dRes] = await Promise.all([
      fetch('http://localhost:5000/api/vehicles/available', { headers }),
      fetch('http://localhost:5000/api/drivers/available', { headers }),
    ]);
    if (vRes.ok) setAvailVehicles(await vRes.json());
    if (dRes.ok) setAvailDrivers(await dRes.json());
  };

  useEffect(() => { fetchTrips(); }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('http://localhost:5000/api/trips', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        cargoWeight: Number(form.cargoWeight),
        plannedDistance: Number(form.plannedDistance)
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.message || 'Failed to create trip');
    setShowCreate(false);
    setForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '', expectedRevenue: '' });
    fetchTrips();
    completeStep('create-trip'); // Req 21.2 step 3
  };

  const handleDispatch = async (tripId: string) => {
    setActionError('');
    const res = await fetch(`http://localhost:5000/api/trips/${tripId}/dispatch`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) return setActionError(data.message || 'Failed to dispatch');
    fetchTrips();
    completeStep('dispatch-trip'); // Req 21.2 step 4
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showComplete) return;
    setActionError('');
    const res = await fetch(`http://localhost:5000/api/trips/${showComplete}/complete`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        finalOdometer: Number(completeForm.finalOdometer),
        fuelConsumed: Number(completeForm.fuelConsumed),
        actualDistance: Number(completeForm.actualDistance),
      }),
    });
    const data = await res.json();
    if (!res.ok) return setActionError(data.message || 'Failed to complete trip');
    setShowComplete(null);
    setCompleteForm({ finalOdometer: '', fuelConsumed: '', actualDistance: '' });
    fetchTrips();
    completeStep('complete-trip'); // Req 21.2 step 5
  };

  const handleCancel = async (tripId: string) => {
    if (!confirm('Cancel this trip?')) return;
    setActionError('');
    const res = await fetch(`http://localhost:5000/api/trips/${tripId}/cancel`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) return setActionError(data.message || 'Failed to cancel trip');
    fetchTrips();
  };

  const openCreate = async () => {
    await fetchAvailable();
    setShowCreate(true);
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em]">
            {trips.length} total trip{trips.length !== 1 ? 's' : ''}
          </div>
        </div>
        {canManage && (
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Create Trip
          </Button>
        )}
      </div>

      {/* Status legend / stepper diagram */}
      <Card className="p-4">
        <div className="flex items-center gap-2 flex-wrap text-[0.75rem] text-text-muted">
          <span className="font-semibold text-white">Lifecycle:</span>
          <TripStepper status="DRAFT" />
          <span className="mx-1 text-text-muted">→ Dispatch →</span>
          <TripStepper status="DISPATCHED" />
          <span className="mx-1 text-text-muted">→ Complete →</span>
          <TripStepper status="COMPLETED" />
          <span className="mx-3 text-text-muted">or</span>
          <TripStepper status="CANCELLED" />
        </div>
      </Card>

      {actionError && (
        <div className="flex items-center gap-2 bg-status-danger/10 border border-status-danger/30 rounded-lg px-4 py-3 text-status-danger text-sm">
          <AlertTriangle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Trip Board */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ROUTE</TableHead>
              <TableHead>VEHICLE</TableHead>
              <TableHead>DRIVER</TableHead>
              <TableHead>CARGO</TableHead>
              <TableHead>LIFECYCLE</TableHead>
              <TableHead>STATUS</TableHead>
              {canManage && <TableHead>ACTIONS</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map(trip => (
              <TableRow key={trip.id} className={trip.status === 'CANCELLED' ? 'opacity-50' : ''}>
                <TableCell>
                  <div className="font-semibold text-white text-sm">{trip.source}</div>
                  <div className="text-text-muted text-xs">→ {trip.destination}</div>
                </TableCell>
                <TableCell mono className="text-text-muted text-sm">
                  {trip.vehicle ? (trip.vehicle as any).registrationNumber || (trip.vehicle as any).name : '—'}
                </TableCell>
                <TableCell className="text-text-muted text-sm">
                  {trip.driver ? (trip.driver as any).name : '—'}
                </TableCell>
                <TableCell mono className="text-text-muted text-sm">
                  {trip.cargoWeight?.toLocaleString()} kg
                </TableCell>
                <TableCell>
                  <TripStepper status={trip.status} />
                </TableCell>
                <TableCell>
                  <StatusChip status={trip.status} domain="trip" />
                </TableCell>
                {canManage && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {trip.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handleDispatch(trip.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[0.7rem] font-medium text-accent bg-accent/10 hover:bg-accent/20 border border-accent/20 rounded transition-colors"
                            title="Dispatch"
                          >
                            <Send size={12} /> Dispatch
                          </button>
                          <button
                            onClick={() => handleCancel(trip.id)}
                            className="p-1.5 text-text-muted hover:text-status-danger bg-white/5 hover:bg-status-danger/10 rounded transition-colors"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                      {trip.status === 'DISPATCHED' && (
                        <>
                          <button
                            onClick={() => { setShowComplete(trip.id); setActionError(''); }}
                            className="flex items-center gap-1 px-2 py-1 text-[0.7rem] font-medium text-status-available bg-status-available/10 hover:bg-status-available/20 border border-status-available/20 rounded transition-colors"
                            title="Complete"
                          >
                            <CheckCircle size={12} /> Complete
                          </button>
                          <button
                            onClick={() => handleCancel(trip.id)}
                            className="p-1.5 text-text-muted hover:text-status-danger bg-white/5 hover:bg-status-danger/10 rounded transition-colors"
                            title="Cancel"
                          >
                            <XCircle size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {trips.length === 0 && (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="text-center py-10 text-text-muted">
                  No trips yet — create one to get started
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Trip Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Trip">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-status-danger text-sm bg-status-danger/10 rounded p-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Source</label>
              <Input required value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="City A" />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Destination</label>
              <Input required value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="City B" />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Vehicle</label>
              <Select value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select available vehicle...</option>
                {availVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber}) — {v.maxLoadCapacity.toLocaleString()} kg max
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Driver</label>
              <Select value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Select available driver...</option>
                {availDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.licenseCategory}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Cargo Weight (kg)</label>
              <Input
                type="number" required min="0"
                value={form.cargoWeight}
                onChange={e => setForm({ ...form, cargoWeight: e.target.value })}
                placeholder="5000"
              />
              {overCapacity && (
                <div className="mt-1 flex items-center gap-1 text-[0.7rem] text-status-danger">
                  <AlertTriangle size={12} />
                  Exceeds vehicle capacity ({selectedVehicle!.maxLoadCapacity.toLocaleString()} kg) — dispatch will fail
                </div>
              )}
              {selectedVehicle && cargoNum > 0 && !overCapacity && (
                <div className="mt-1 text-[0.7rem] text-status-available">
                  ✓ Within capacity ({selectedVehicle.maxLoadCapacity.toLocaleString()} kg max)
                </div>
              )}
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Planned Distance (km)</label>
              <Input
                type="number" required min="0"
                value={form.plannedDistance}
                onChange={e => setForm({ ...form, plannedDistance: e.target.value })}
                placeholder="300"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Expected Revenue (₹, optional)</label>
              <Input
                type="number" min="0"
                value={form.expectedRevenue}
                onChange={e => setForm({ ...form, expectedRevenue: e.target.value })}
                placeholder="1500"
              />
            </div>
          </div>

          {/* Req 17 — cost & margin estimate */}
          <CostEstimator
            vehicleId={form.vehicleId || undefined}
            plannedDistance={Number(form.plannedDistance) || undefined}
            revenue={Number(form.expectedRevenue) || undefined}
          />

          {/* Req 16 — live eligibility panel */}
          <EligibilityPanel
            cargoWeight={Number(form.cargoWeight) || undefined}
            vehicleId={form.vehicleId || undefined}
            driverId={form.driverId || undefined}
          />

          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Save as Draft</Button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={!!showComplete} onClose={() => setShowComplete(null)} title="Complete Trip">
        <form onSubmit={handleComplete} className="space-y-4">
          {actionError && (
            <div className="text-status-danger text-sm bg-status-danger/10 rounded p-2">{actionError}</div>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Final Odometer (km)</label>
              <Input
                type="number" required min="0"
                value={completeForm.finalOdometer}
                onChange={e => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })}
                placeholder="75000"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Actual Distance (km)</label>
              <Input
                type="number" min="0"
                value={completeForm.actualDistance}
                onChange={e => setCompleteForm({ ...completeForm, actualDistance: e.target.value })}
                placeholder="320"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Fuel Consumed (L)</label>
              <Input
                type="number" min="0"
                value={completeForm.fuelConsumed}
                onChange={e => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })}
                placeholder="45"
              />
            </div>
          </div>
          <p className="text-[0.75rem] text-text-muted">This will mark the trip completed, restore the vehicle and driver to Available, and update odometer.</p>
          <div className="pt-2 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowComplete(null)}>Back</Button>
            <Button type="submit">Mark Complete</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
