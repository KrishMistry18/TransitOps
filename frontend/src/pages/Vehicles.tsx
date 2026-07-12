import React, { useState, useEffect, useContext } from 'react';
import { Vehicle } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, Card, Input, Select, Table, TableHeader, TableRow, 
  TableHead, TableBody, TableCell, StatusChip, Modal 
} from '../components/ui';
import { Search, Plus, Info } from 'lucide-react';

export default function Vehicles() {
  const { token } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    type: 'Van',
    maxLoadCapacity: 0,
    odometer: 0,
    acquisitionCost: 0,
    region: 'North'
  });
  const [error, setError] = useState('');

  const fetchVehicles = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (typeFilter !== 'All') query.append('type', typeFilter);
      if (statusFilter !== 'All') query.append('status', statusFilter);

      const res = await fetch(`http://localhost:5000/api/vehicles?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, typeFilter, statusFilter, token]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          maxLoadCapacity: Number(formData.maxLoadCapacity),
          odometer: Number(formData.odometer),
          acquisitionCost: Number(formData.acquisitionCost)
        })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add vehicle');
      }
      
      setShowAddModal(false);
      fetchVehicles();
      setFormData({
        registrationNumber: '', name: '', type: 'Van', 
        maxLoadCapacity: 0, odometer: 0, acquisitionCost: 0, region: 'North'
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4 flex-wrap">
          <div className="w-48">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Type</label>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
            </Select>
          </div>
          <div className="w-48">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </Select>
          </div>
          <div className="w-64">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Search reg. no...</label>
            <Input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={16} />}
              shortcut="⌘K"
            />
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Vehicle
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>REG. NO. (UNIQUE)</TableHead>
              <TableHead>NAME/MODEL</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>CAPACITY</TableHead>
              <TableHead>ODOMETER</TableHead>
              <TableHead>ACQ. COST</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell mono>
                  <span className="font-semibold text-[0.9375rem] text-white">{v.registrationNumber}</span>
                </TableCell>
                <TableCell className="text-text-muted">{v.name}</TableCell>
                <TableCell className="text-text-muted">{v.type}</TableCell>
                <TableCell mono className="text-text-muted">{v.maxLoadCapacity} kg</TableCell>
                <TableCell mono className="text-text-muted">{v.odometer.toLocaleString()}</TableCell>
                <TableCell mono className="text-text-muted">${v.acquisitionCost.toLocaleString()}</TableCell>
                <TableCell>
                  <StatusChip status={v.status} domain="vehicle" />
                </TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-text-muted">
                  No vehicles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-4 bg-[#1B212B]/40 backdrop-blur-md border border-white/5 border-l-accent-primary/80 p-4 rounded-xl shadow-sm text-sm text-text-primary">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-primary/10 shrink-0">
              <Info className="w-4 h-4 text-accent-primary" />
            </div>
            <span><strong className="text-white">Rule:</strong> Registration No. must be unique &bull; Retired / In Shop vehicles are hidden from Trip Dispatcher</span>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Vehicle"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          {error && <div className="text-status-danger text-sm">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Registration No.</label>
              <Input
                required
                value={formData.registrationNumber}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="GJ01AB452"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Name/Model</label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="VAN-05"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Type</label>
              <Select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Mini">Mini</option>
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Capacity (kg)</label>
              <Input
                type="number"
                required
                value={formData.maxLoadCapacity}
                onChange={e => setFormData({ ...formData, maxLoadCapacity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Odometer</label>
              <Input
                type="number"
                required
                value={formData.odometer}
                onChange={e => setFormData({ ...formData, odometer: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Acq. Cost</label>
              <Input
                type="number"
                required
                value={formData.acquisitionCost}
                onChange={e => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Region</label>
              <Input
                required
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">Save Vehicle</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
