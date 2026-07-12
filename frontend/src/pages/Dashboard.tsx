import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { KPICard } from '../components/ui/KPICard';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { StatusChip } from '../components/ui/StatusChip';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import HorizontalBar from '../components/analytics/HorizontalBar';

interface DashboardKPIs {
  activeVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
  atRiskTrips: number;
  recoveredTrips: number;
}

interface RecentTrip {
  id: number;
  tripCode: string;
  vehicle: string;
  vehicleReg: string;
  driver: string;
  source: string;
  destination: string;
  status: string;
  dispatchedAt: string | null;
  completedAt: string | null;
}

interface VehicleStatusItem {
  status: string;
  count: number;
}

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#4CAF7D',
  ON_TRIP: '#E8A23D',
  IN_SHOP: '#8A93A3',
  RETIRED: '#E0575B',
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

const MOCK_KPIS: DashboardKPIs = {
  activeVehicles: 53,
  availableVehicles: 42,
  inMaintenance: 5,
  activeTrips: 18,
  pendingTrips: 9,
  driversOnDuty: 26,
  fleetUtilizationPct: 81.0,
  atRiskTrips: 0,
  recoveredTrips: 0,
};

const MOCK_TRIPS: RecentTrip[] = [
  { id: 1, tripCode: 'TR001', vehicle: 'Truck Alpha', vehicleReg: 'TRK-2000', driver: 'John Marcus', source: 'Depot North', destination: 'Hub Central', status: 'DISPATCHED', dispatchedAt: new Date().toISOString(), completedAt: null },
  { id: 2, tripCode: 'TR002', vehicle: 'Van Beta', vehicleReg: 'VAN-1050', driver: 'Sarah Chen', source: 'Warehouse East', destination: 'Port South', status: 'COMPLETED', dispatchedAt: new Date().toISOString(), completedAt: new Date().toISOString() },
  { id: 3, tripCode: 'TR003', vehicle: 'Truck Gamma', vehicleReg: 'TRK-2002', driver: 'Mike Torres', source: 'Hub Central', destination: 'Depot West', status: 'DRAFT', dispatchedAt: null, completedAt: null },
  { id: 4, tripCode: 'TR004', vehicle: 'Truck Delta', vehicleReg: 'TRK-2003', driver: 'Lisa Park', source: 'Port South', destination: 'Depot North', status: 'DISPATCHED', dispatchedAt: new Date().toISOString(), completedAt: null },
  { id: 5, tripCode: 'TR005', vehicle: 'Van Epsilon', vehicleReg: 'VAN-1051', driver: 'David Okon', source: 'Depot North', destination: 'Warehouse East', status: 'CANCELLED', dispatchedAt: null, completedAt: null },
  { id: 6, tripCode: 'TR006', vehicle: 'Truck Zeta', vehicleReg: 'TRK-2005', driver: 'Amy Walsh', source: 'Hub Central', destination: 'Port South', status: 'DRAFT', dispatchedAt: null, completedAt: null },
];

const MOCK_STATUS: VehicleStatusItem[] = [
  { status: 'AVAILABLE', count: 42 },
  { status: 'ON_TRIP', count: 18 },
  { status: 'IN_SHOP', count: 5 },
  { status: 'RETIRED', count: 3 },
];

export default function Dashboard() {
  const { token } = useContext(AuthContext);
  const [kpis, setKpis] = useState<DashboardKPIs>(MOCK_KPIS);
  const [recentTrips, setRecentTrips] = useState<RecentTrip[]>(MOCK_TRIPS);
  const [vehicleStatus, setVehicleStatus] = useState<VehicleStatusItem[]>(MOCK_STATUS);
  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    Promise.allSettled([
      fetch('http://localhost:5000/api/dashboard/kpis', { headers }).then(r => r.json()),
      fetch('http://localhost:5000/api/dashboard/recent-trips', { headers }).then(r => r.json()),
      fetch('http://localhost:5000/api/dashboard/vehicle-status', { headers }).then(r => r.json()),
    ]).then(([kpiResult, tripsResult, statusResult]) => {
      if (kpiResult.status === 'fulfilled' && !kpiResult.value.message) {
        setKpis(kpiResult.value);
      }
      if (tripsResult.status === 'fulfilled' && Array.isArray(tripsResult.value)) {
        if (tripsResult.value.length > 0) setRecentTrips(tripsResult.value);
      }
      if (statusResult.status === 'fulfilled' && Array.isArray(statusResult.value)) {
        if (statusResult.value.length > 0) setVehicleStatus(statusResult.value);
      }
      setLoading(false);
    });
  }, [token]);

  const formatETA = (trip: RecentTrip) => {
    if (trip.status === 'COMPLETED') return 'Arrived';
    if (trip.status === 'CANCELLED' || trip.status === 'DRAFT') {
      return trip.status === 'DRAFT' ? 'Not dispatched' : String.fromCharCode(8212);
    }
    if (trip.dispatchedAt) {
      const d = new Date(trip.dispatchedAt);
      const eta = new Date(d.getTime() + 4 * 60 * 60 * 1000);
      return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return String.fromCharCode(8212);
  };

  return (
    <div className="space-y-24">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-12 mb-4">
          <div className="w-[3px] h-[28px] rounded-full bg-mod-dashboard" />
          <h1 className="text-[1.5rem] font-display font-bold text-text-primary">
            Operational Dashboard
          </h1>
        </div>
        <p className="text-text-muted text-[0.875rem] ml-[15px]">
          Real-time fleet overview: vehicles, drivers, trips, and utilization at a glance.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-12">
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-[180px]">
          <option value="">All Types</option>
          <option value="Heavy Duty">Heavy Duty</option>
          <option value="Light Duty">Light Duty</option>
          <option value="Van">Van</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[180px]">
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
          <option value="RETIRED">Retired</option>
        </Select>
        <Select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="w-[180px]">
          <option value="">All Regions</option>
          <option value="North">North</option>
          <option value="South">South</option>
          <option value="East">East</option>
          <option value="West">West</option>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-16">
        <KPICard label="Active Vehicles" value={kpis.activeVehicles} accent="#5B8DEF" trend="up" trendValue="+3" />
        <KPICard label="Available Vehicles" value={kpis.availableVehicles} accent="#4CAF7D" trend="neutral" />
        <KPICard label="In Maintenance" value={kpis.inMaintenance} accent="#8A93A3" trend={kpis.inMaintenance > 3 ? 'down' : 'neutral'} />
        <KPICard label="Active Trips" value={kpis.activeTrips} accent="#4CAF7D" trend="up" trendValue="+5" />
        <KPICard label="Pending Trips" value={kpis.pendingTrips} accent="#E8A23D" trend="neutral" />
        <KPICard label="Drivers on Duty" value={kpis.driversOnDuty} accent="#E8A23D" />
        <KPICard label="Fleet Utilization" value={kpis.fleetUtilizationPct + '%'} accent="#5B8DEF" trend={kpis.fleetUtilizationPct >= 70 ? 'up' : 'down'} trendValue={kpis.fleetUtilizationPct >= 70 ? 'Good' : 'Low'} />
        <KPICard label="At-Risk Trips" value={kpis.atRiskTrips > 0 ? kpis.atRiskTrips : String.fromCharCode(8212)} accent="#E0575B" />
        <KPICard label="Recovered Today" value={kpis.recoveredTrips > 0 ? kpis.recoveredTrips : String.fromCharCode(8212)} accent="#4CAF7D" />
      </div>

      {/* Bottom Grid: Recent Trips + Vehicle Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-16">
        {/* Recent Trips - 2/3 width */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-16">
            <h2 className="text-[1.125rem] font-display font-semibold text-text-primary">Recent Trips</h2>
            <span className="text-text-muted text-[0.75rem] font-medium uppercase tracking-[0.04em]">
              Last {recentTrips.length} trips
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-text-muted py-32">
                    No active trips. Create a draft trip to get started.
                  </TableCell>
                </TableRow>
              ) : (
                recentTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell mono>{trip.tripCode}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-text-primary text-sm">{trip.vehicle}</span>
                        <span className="text-text-muted font-mono text-[0.75rem]">{trip.vehicleReg}</span>
                      </div>
                    </TableCell>
                    <TableCell>{trip.driver}</TableCell>
                    <TableCell>
                      <span className="text-text-muted text-[0.8125rem]">
                        {trip.source} {String.fromCharCode(8594)} {trip.destination}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={trip.status} domain="trip" />
                    </TableCell>
                    <TableCell mono>{formatETA(trip)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Vehicle Status Distribution - 1/3 width */}
        <Card>
          <h2 className="text-[1.125rem] font-display font-semibold text-text-primary mb-16">Vehicle Status</h2>
          <div className="space-y-24">
            <HorizontalBar
              segments={vehicleStatus.map((s) => ({
                label: STATUS_LABELS[s.status] || s.status,
                value: s.count,
                color: STATUS_COLORS[s.status] || '#8A93A3',
              }))}
              height={32}
            />
            <div className="space-y-16">
              {vehicleStatus.map((s) => {
                const total = vehicleStatus.reduce((sum, item) => sum + item.count, 0);
                const pct = total > 0 ? ((s.count / total) * 100).toFixed(1) : '0';
                return (
                  <div key={s.status} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <span className="w-[8px] h-[8px] rounded-full" style={{ backgroundColor: STATUS_COLORS[s.status] || '#8A93A3' }} />
                        <span className="text-text-muted text-[0.8125rem]">{STATUS_LABELS[s.status] || s.status}</span>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className="font-mono text-text-primary text-[0.8125rem]">{s.count}</span>
                        <span className="text-text-muted text-[0.75rem]">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-[6px] bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: pct + '%', backgroundColor: STATUS_COLORS[s.status] || '#8A93A3' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
