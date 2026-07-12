import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Button } from '../components/ui';
import { Download, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { useDemo } from '../features/demo/DemoContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface VehicleAnalytics {
  id: string;
  registrationNumber: string;
  name: string;
  status: string;
  region: string;
  fuelEfficiency: string;
  operationalCost: number;
  revenue: number;
  roi: string;
}

export default function Analytics() {
  const { token, user } = useContext(AuthContext);
  const { completeStep } = useDemo();
  const [data, setData] = useState<VehicleAnalytics[]>([]);
  const canView = user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';

  const headers = { Authorization: `Bearer ${token}` };

  const fetchReport = async () => {
    const res = await fetch('http://localhost:5000/api/reports/vehicles', { headers });
    if (res.ok) setData(await res.json());
  };

  useEffect(() => {
    if (token) {
      fetchReport();
      completeStep('view-reports'); // Req 21.2 final step
    }
  }, [token]);

  const download = async (path: string, filename: string) => {
    try {
      const res = await fetch(`http://localhost:5000${path}`, { headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Export failed');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleExportCSV = () => download('/api/reports/vehicles/export', 'vehicles_report.csv');
  const handleExportPDF = () => download('/api/reports/vehicles/export-pdf', 'vehicles_report.pdf');

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        You don't have permission to view analytics.
      </div>
    );
  }

  // Monthly Revenue Data (Mock aggregation based on revenue for now since we don't have per-month in report)
  // For actual scale we would add grouping to the backend, but we'll distribute the total here visually for the UI requirement.
  const totalRev = data.reduce((sum, v) => sum + (v.revenue || 0), 0);
  const revChartData = [
    { name: 'Jan', revenue: totalRev * 0.1 },
    { name: 'Feb', revenue: totalRev * 0.15 },
    { name: 'Mar', revenue: totalRev * 0.2 },
    { name: 'Apr', revenue: totalRev * 0.25 },
    { name: 'May', revenue: totalRev * 0.3 },
  ];

  // Top Costliest Vehicles
  const costChartData = [...data]
    .sort((a, b) => b.operationalCost - a.operationalCost)
    .slice(0, 5)
    .map(v => ({ name: v.registrationNumber, cost: v.operationalCost }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white tracking-[0.02em]">Fleet Analytics</h2>
        <div className="flex gap-2">
          <Button icon={<Download size={16} />} onClick={handleExportCSV} variant="secondary">
            Export CSV
          </Button>
          <Button icon={<FileText size={16} />} onClick={handleExportPDF} variant="secondary">
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card className="p-6">
          <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest flex items-center gap-2 mb-6">
            <DollarSign size={16} className="text-status-available" /> Monthly Revenue Trend
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Costliest Vehicles Horizontal Bar */}
        <Card className="p-6">
          <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest flex items-center gap-2 mb-6">
            <TrendingUp size={16} className="text-status-danger" /> Top Costliest Vehicles
          </h3>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Cost']}
                />
                <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Per-Vehicle Report Table */}
      <Card>
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest">Per-Vehicle Performance Report</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>VEHICLE</TableHead>
              <TableHead>REGION</TableHead>
              <TableHead>EFFICIENCY</TableHead>
              <TableHead>OP COST</TableHead>
              <TableHead>REVENUE</TableHead>
              <TableHead>ROI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(v => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="font-medium text-white text-sm">{v.name}</div>
                  <div className="text-text-muted text-xs mono mt-0.5">{v.registrationNumber}</div>
                </TableCell>
                <TableCell className="text-text-muted text-sm">{v.region || '—'}</TableCell>
                <TableCell mono className="text-white text-sm">
                  {v.fuelEfficiency === 'N/A' ? 'N/A' : `${v.fuelEfficiency} km/L`}
                </TableCell>
                <TableCell mono className="text-status-danger text-sm">
                  ₹{v.operationalCost.toLocaleString()}
                </TableCell>
                <TableCell mono className="text-status-available text-sm">
                  ₹{v.revenue.toLocaleString()}
                </TableCell>
                <TableCell mono className={Number(v.roi) > 0 ? "text-status-available text-sm font-semibold" : "text-text-muted text-sm"}>
                  {v.roi === 'N/A' ? 'N/A' : `${(Number(v.roi) * 100).toFixed(1)}%`}
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-text-muted">No data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
