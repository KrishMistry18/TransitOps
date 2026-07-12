import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { KPICard } from '../components/ui/KPICard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import MiniBarChart from '../components/analytics/MiniBarChart';
import { Download } from 'lucide-react';

interface AnalyticsKPIs {
  fuelEfficiency: number | null;
  fleetUtilization: number;
  operationalCost: number;
  vehicleROI: number | null;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface CostliestVehicle {
  id: number;
  registrationNumber: string;
  name: string;
  fuelCost: number;
  maintenanceCost: number;
  totalCost: number;
}

const DASH = String.fromCharCode(8212);

const MOCK_KPIS: AnalyticsKPIs = {
  fuelEfficiency: 8.4,
  fleetUtilization: 81.0,
  operationalCost: 34070,
  vehicleROI: 14.2,
};

const MOCK_REVENUE: MonthlyRevenue[] = [
  { month: 'Jan', revenue: 12400 },
  { month: 'Feb', revenue: 15800 },
  { month: 'Mar', revenue: 13200 },
  { month: 'Apr', revenue: 18900 },
  { month: 'May', revenue: 22100 },
  { month: 'Jun', revenue: 19500 },
];

const MOCK_COSTLIEST: CostliestVehicle[] = [
  { id: 1, registrationNumber: 'TRK-2002', name: 'Truck Gamma', fuelCost: 4200, maintenanceCost: 3100, totalCost: 7300 },
  { id: 2, registrationNumber: 'TRK-2000', name: 'Truck Alpha', fuelCost: 3800, maintenanceCost: 1500, totalCost: 5300 },
  { id: 3, registrationNumber: 'TRK-2003', name: 'Truck Delta', fuelCost: 2900, maintenanceCost: 1800, totalCost: 4700 },
  { id: 4, registrationNumber: 'VAN-1050', name: 'Van Beta', fuelCost: 1600, maintenanceCost: 800, totalCost: 2400 },
  { id: 5, registrationNumber: 'TRK-2005', name: 'Truck Zeta', fuelCost: 1200, maintenanceCost: 600, totalCost: 1800 },
];

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'k';
  }
  return '$' + value.toLocaleString();
}

export default function Analytics() {
  const { token } = useContext(AuthContext);
  const [kpis, setKpis] = useState<AnalyticsKPIs>(MOCK_KPIS);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>(MOCK_REVENUE);
  const [costliest, setCostliest] = useState<CostliestVehicle[]>(MOCK_COSTLIEST);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    Promise.allSettled([
      fetch('http://localhost:5000/api/analytics/kpis', { headers }).then(r => r.json()),
      fetch('http://localhost:5000/api/analytics/monthly-revenue', { headers }).then(r => r.json()),
      fetch('http://localhost:5000/api/analytics/top-costliest-vehicles', { headers }).then(r => r.json()),
    ]).then(([kpiResult, revenueResult, costResult]) => {
      if (kpiResult.status === 'fulfilled' && !kpiResult.value.message) {
        setKpis(kpiResult.value);
      }
      if (revenueResult.status === 'fulfilled' && Array.isArray(revenueResult.value)) {
        if (revenueResult.value.length > 0) setMonthlyRevenue(revenueResult.value);
      }
      if (costResult.status === 'fulfilled' && Array.isArray(costResult.value)) {
        if (costResult.value.length > 0) setCostliest(costResult.value);
      }
      setLoading(false);
    });
  }, [token]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = 'Bearer ' + token;

      const res = await fetch('http://localhost:5000/api/analytics/export.csv', { headers });
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fleet-analytics-report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export error:', err);
    } finally {
      setExporting(false);
    }
  };

  const maxCost = costliest.length > 0 ? costliest[0].totalCost : 1;

  const revenueChartData = monthlyRevenue.map(item => ({
    name: item.month,
    value: item.revenue,
    color: '#5B8DEF',
  }));

  return (
    <div className="space-y-24">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-16">
        <div>
          <div className="flex items-center gap-12 mb-4">
            <div className="w-[3px] h-[28px] rounded-full" style={{ backgroundColor: '#5FD0D9' }} />
            <h1 className="text-[1.5rem] font-display font-bold text-text-primary">
              Reports &amp; Analytics
            </h1>
          </div>
          <p className="text-text-muted text-[0.875rem] ml-[15px]">
            Fleet efficiency, utilization, cost analysis, and ROI metrics.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-8"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-16">
        <KPICard
          label="Fuel Efficiency"
          value={kpis.fuelEfficiency !== null ? kpis.fuelEfficiency + ' km/l' : 'N/A'}
          accent="#5FD0D9"
          trend={kpis.fuelEfficiency !== null && kpis.fuelEfficiency >= 8 ? 'up' : 'down'}
          trendValue={kpis.fuelEfficiency !== null && kpis.fuelEfficiency >= 8 ? 'Efficient' : 'Below avg'}
        />
        <KPICard
          label="Fleet Utilization"
          value={kpis.fleetUtilization + '%'}
          accent="#5FD0D9"
          trend={kpis.fleetUtilization >= 70 ? 'up' : 'down'}
          trendValue={kpis.fleetUtilization >= 70 ? 'Good' : 'Low'}
        />
        <KPICard
          label="Operational Cost"
          value={formatCurrency(kpis.operationalCost)}
          accent="#C97BE4"
          trend="neutral"
        />
        <KPICard
          label="Vehicle ROI"
          value={kpis.vehicleROI !== null ? kpis.vehicleROI + '%' : 'N/A'}
          accent="#C97BE4"
          trend={kpis.vehicleROI !== null && kpis.vehicleROI > 10 ? 'up' : 'neutral'}
          trendValue={kpis.vehicleROI !== null && kpis.vehicleROI > 10 ? 'Profitable' : undefined}
        />
      </div>

      {/* ROI Formula Caption */}
      <p className="text-text-muted text-[0.75rem] -mt-12 ml-4 font-mono">
        ROI = (Revenue - (Maintenance Cost + Fuel Cost)) / Acquisition Cost * 100
      </p>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
        {/* Monthly Revenue Chart */}
        <Card accent="#5FD0D9">
          <h2 className="text-[1.125rem] font-display font-semibold text-text-primary mb-16">
            Monthly Revenue
          </h2>
          <MiniBarChart
            data={revenueChartData}
            height={300}
            formatValue={(v) => formatCurrency(v)}
          />
        </Card>

        {/* Top Costliest Vehicles */}
        <Card accent="#C97BE4">
          <h2 className="text-[1.125rem] font-display font-semibold text-text-primary mb-16">
            Top Costliest Vehicles
          </h2>
          {costliest.length === 0 ? (
            <p className="text-text-muted text-sm text-center py-32">
              No cost data available yet. Record fuel logs and maintenance to see rankings.
            </p>
          ) : (
            <div className="space-y-16">
              {costliest.map((v, idx) => (
                <div key={v.id} className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-12">
                      <span className="text-text-muted text-[0.75rem] font-mono w-[20px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="text-text-primary text-sm">{v.name}</span>
                        <span className="text-text-muted font-mono text-[0.75rem] ml-8">{v.registrationNumber}</span>
                      </div>
                    </div>
                    <span className="font-mono text-text-primary text-[0.875rem] font-medium">
                      {formatCurrency(v.totalCost)}
                    </span>
                  </div>
                  {/* Stacked bar: fuel (blue) + maintenance (violet) */}
                  <div className="flex h-[8px] rounded-full overflow-hidden bg-border ml-[32px]">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: ((v.fuelCost / maxCost) * 100) + '%',
                        backgroundColor: '#5B8DEF',
                      }}
                      title={'Fuel: ' + formatCurrency(v.fuelCost)}
                    />
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: ((v.maintenanceCost / maxCost) * 100) + '%',
                        backgroundColor: '#C97BE4',
                      }}
                      title={'Maintenance: ' + formatCurrency(v.maintenanceCost)}
                    />
                  </div>
                  {/* Cost breakdown labels */}
                  <div className="flex gap-16 ml-[32px]">
                    <div className="flex items-center gap-4">
                      <span className="w-[6px] h-[6px] rounded-full bg-accent-primary" />
                      <span className="text-text-muted text-[0.7rem]">Fuel {formatCurrency(v.fuelCost)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="w-[6px] h-[6px] rounded-full" style={{ backgroundColor: '#C97BE4' }} />
                      <span className="text-text-muted text-[0.7rem]">Maint. {formatCurrency(v.maintenanceCost)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
