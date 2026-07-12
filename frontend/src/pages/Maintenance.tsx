import React, { useState, useEffect, useContext } from 'react';
import { MaintenanceLog, Vehicle } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, Card, Input, Select, Table, TableHeader, TableRow, 
  TableHead, TableBody, TableCell, StatusChip 
} from '../components/ui';

type MaintenanceLogWithVehicle = MaintenanceLog & { vehicle: Vehicle };

export default function Maintenance() {
  const { token } = useContext(AuthContext);
  const [logs, setLogs] = useState<MaintenanceLogWithVehicle[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    description: '',
    cost: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        fetch('http://localhost:5000/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/vehicles', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (logsRes.ok && vehiclesRes.ok) {
        const logsData = await logsRes.json();
        const vehiclesData = await vehiclesRes.json();
        setLogs(logsData);
        setVehicles(vehiclesData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:5000/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to log service record');
      }
      
      setFormData({
        vehicleId: '',
        description: '',
        cost: '',
        date: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    search ? log.vehicle.registrationNumber.toLowerCase().includes(search.toLowerCase()) || 
             log.vehicle.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  // Available vehicles for maintenance (not in shop, not on trip, not retired)
  const availableVehicles = vehicles.filter(v => v.status !== 'IN_SHOP' && v.status !== 'RETIRED' && v.status !== 'ON_TRIP');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-64">
          <Input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Form */}
        <div className="w-full lg:w-1/3">
          <h3 className="text-[1.125rem] font-display font-semibold text-text-primary mb-4 uppercase tracking-[0.04em]">Log Service Record</h3>
          <Card>
            <form onSubmit={handleSave} className="space-y-4">
              {error && <div className="text-status-danger text-sm font-medium">{error}</div>}
              
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Vehicle</label>
                <Select
                  required
                  value={formData.vehicleId}
                  onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                  <option value="" disabled>Select a vehicle...</option>
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.registrationNumber})
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Service Type</label>
                <Input
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Oil Change"
                />
              </div>
              
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Cost</label>
                <Input
                  type="number"
                  required
                  value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="2500"
                />
              </div>
              
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Date</label>
                <Input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Status</label>
                <Input
                  value="Active"
                  disabled
                  className="bg-surface opacity-70"
                />
              </div>
              
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex flex-col gap-2">
                <div className="flex items-center text-[0.75rem]">
                  <span className="text-status-available w-20 font-medium">Available</span>
                  <span className="text-text-muted mx-2">â”€â”€â”€â”€ creating active record â”€â”€â”€â”€â–¶</span>
                  <span className="text-status-inshop font-medium">In Shop</span>
                </div>
                <div className="flex items-center text-[0.75rem]">
                  <span className="text-status-inshop w-20 font-medium">In Shop</span>
                  <span className="text-text-muted mx-2">â”€â”€â”€â”€ closing record (not retired) â”€â”€â”€â”€â–¶</span>
                  <span className="text-status-available font-medium">Available</span>
                </div>
                <p className="text-[0.75rem] text-text-muted mt-2 italic">
                  Note: In Shop vehicles are removed from the dispatch pool.
                </p>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Table */}
        <div className="w-full lg:w-2/3">
          <h3 className="text-[1.125rem] font-display font-semibold text-text-primary mb-4 uppercase tracking-[0.04em]">Service Log</h3>
          <Card className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VEHICLE</TableHead>
                  <TableHead>SERVICE</TableHead>
                  <TableHead>COST</TableHead>
                  <TableHead>STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell mono>{log.vehicle?.name || 'Unknown'}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell mono>{log.cost?.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusChip status={log.status === 'ACTIVE' ? 'IN_SHOP' : 'AVAILABLE'} domain="vehicle" />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-text-muted">
                      No service records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
