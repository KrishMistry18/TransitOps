import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, Select, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, StatusChip } from '../components/ui';
import { Activity, Truck, Wrench, MapPin, CheckCircle, Clock, Percent, ShieldAlert, ShieldCheck, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Trip } from '@shared/types';

interface DashboardStats {
  activeVehicles: number | string | null;
  availableVehicles: number | string | null;
  vehiclesInMaintenance: number | string | null;
  activeTrips: number | string | null;
  pendingTrips: number | string | null;
  driversOnDuty: number | string | null;
  fleetUtilization: string | null;
  atRiskTrips: number | string | null;
  recoveredToday: number | string | null;
  _warnings?: string;
}

// Which KPI labels are "primary" per role (Req 15.1–15.4). Others still show, just after.
const PRIMARY_BY_ROLE: Record<string, string[]> = {
  FLEET_MANAGER: ['Available Vehicles', 'In Maintenance', 'Fleet Utilization', 'At-Risk Trips'],
  SAFETY_OFFICER: ['Drivers On Duty'], // compliance/license widgets shown separately below
  FINANCIAL_ANALYST: [], // cost/fuel/ROI widgets shown separately below (Analytics-oriented)
  DRIVER: ['Active Trips', 'Pending Trips'],
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#64748b']; // green, blue, amber, slate

export default function Dashboard() {
  const { token, user } = useContext(AuthContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchDashboard = async () => {
    const params = new URLSearchParams();
    if (filterType) params.append('type', filterType);
    if (filterStatus) params.append('status', filterStatus);
    if (filterRegion) params.append('region', filterRegion);

    const res = await fetch(`http://localhost:5000/api/dashboard?${params.toString()}`, { headers });
    if (res.ok) setStats(await res.json());
  };

  const fetchTrips = async () => {
    const res = await fetch('http://localhost:5000/api/trips', { headers });
    if (res.ok) {
      const data = await res.json();
      setTrips(data.slice(0, 5)); // Just the most recent 5 trips
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchTrips();
    }
  }, [token, filterType, filterStatus, filterRegion]);

  const primaryLabels = PRIMARY_BY_ROLE[user?.role ?? ''] ?? [];

  const allKpis = [
    { label: 'Active Vehicles', value: stats?.activeVehicles, icon: <Activity size={18} className="text-accent" /> },
    { label: 'Available Vehicles', value: stats?.availableVehicles, icon: <Truck size={18} className="text-status-available" /> },
    { label: 'In Maintenance', value: stats?.vehiclesInMaintenance, icon: <Wrench size={18} className="text-status-inshop" /> },
    { label: 'Active Trips', value: stats?.activeTrips, icon: <MapPin size={18} className="text-status-pending" /> },
    { label: 'Pending Trips', value: stats?.pendingTrips, icon: <Clock size={18} className="text-status-inshop" /> },
    { label: 'Drivers On Duty', value: stats?.driversOnDuty, icon: <CheckCircle size={18} className="text-accent" /> },
    { label: 'Fleet Utilization', value: stats?.fleetUtilization ?? null, icon: <Percent size={18} className="text-accent" /> },
    { label: 'At-Risk Trips', value: stats?.atRiskTrips, icon: <ShieldAlert size={18} className="text-status-danger" /> },
    { label: 'Recovered Today', value: stats?.recoveredToday, icon: <ShieldCheck size={18} className="text-status-available" /> },
  ];

  // Req 15 — primary content first (role-tailored), remaining KPIs after.
  const primaryKpis = allKpis.filter(k => primaryLabels.includes(k.label));
  const otherKpis = allKpis.filter(k => !primaryLabels.includes(k.label));
  const kpis = primaryKpis.length > 0 ? [...primaryKpis, ...otherKpis] : allKpis;

  const num = (v: number | string | null | undefined) => (typeof v === 'number' ? v : 0);
  const pieData = stats ? [
    { name: 'Available', value: num(stats.availableVehicles) },
    { name: 'On Trip', value: num(stats.activeVehicles) },
    { name: 'In Shop', value: num(stats.vehiclesInMaintenance) },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-[0.02em]">Dashboard</h2>
        
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-40 h-8 text-xs">
            <option value="">All Types</option>
            <option value="Heavy Truck">Heavy Truck</option>
            <option value="Van">Van</option>
          </Select>
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-40 h-8 text-xs">
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
          </Select>
          <Select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="w-40 h-8 text-xs">
            <option value="">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </Select>
        </div>
      </div>

      {stats?._warnings && (
        <div className="bg-status-pending/10 text-status-pending text-sm px-4 py-2 rounded border border-status-pending/20">
          ⚠️ {stats._warnings}
        </div>
      )}

      {/* KPI Cards — role-tailored primary content first (Req 15) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const isPrimary = primaryLabels.includes(kpi.label);
          return (
            <Card key={idx} className={`flex items-center gap-4 p-4 ${isPrimary ? 'ring-1 ring-accent-primary/40' : ''}`}>
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">{kpi.icon}</div>
              <div>
                <div className="text-[0.65rem] text-text-muted uppercase tracking-widest">{kpi.label}</div>
                <div className="text-xl font-bold text-white mt-1">
                  {kpi.value === null || kpi.value === undefined ? '—' : kpi.value}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Role-specific secondary content (Req 15.2/15.3) */}
      {user?.role === 'SAFETY_OFFICER' && (
        <Card className="p-4 flex items-center gap-3">
          <ShieldCheck className="text-accent shrink-0" size={18} />
          <span className="text-sm text-text-muted">
            Driver compliance and license validity are tracked on the{' '}
            <a href="/compliance" className="text-accent underline">Compliance Radar</a>.
          </span>
        </Card>
      )}
      {user?.role === 'FINANCIAL_ANALYST' && (
        <Card className="p-4 flex items-center gap-3">
          <DollarSign className="text-status-available shrink-0" size={18} />
          <span className="text-sm text-text-muted">
            Operational cost, fuel, and ROI breakdowns are available on{' '}
            <a href="/analytics" className="text-accent underline">Analytics</a> and{' '}
            <a href="/fuel" className="text-accent underline">Fuel &amp; Expenses</a>.
          </span>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-1 p-6 flex flex-col items-center justify-center">
          <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest self-start w-full border-b border-white/5 pb-2 mb-4">Vehicle Status Distribution</h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-text-muted">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Trips Table */}
        <Card className="lg:col-span-2">
          <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest">Recent Trips</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ROUTE</TableHead>
                <TableHead>VEHICLE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div className="font-medium text-white text-sm">{trip.source} → {trip.destination}</div>
                  </TableCell>
                  <TableCell mono className="text-text-muted text-sm">
                    {trip.vehicle ? (trip.vehicle as any).registrationNumber : '—'}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={trip.status} domain="trip" />
                  </TableCell>
                  <TableCell className="text-text-muted text-xs">
                    {trip.dispatchedAt ? new Date(trip.dispatchedAt).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {trips.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-text-muted">No recent trips</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
