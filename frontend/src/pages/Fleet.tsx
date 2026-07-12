import React, { useState, useEffect, useContext } from 'react';
import { Vehicle } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, Card, Input, Select, Table, TableHeader, TableRow, 
  TableHead, TableBody, TableCell, StatusChip, Modal
} from '../components/ui';
import { Search, Plus, Trash2 } from 'lucide-react';

export default function Fleet() {
  const { token, user } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    model: '',
    type: 'Light Duty',
    maxLoadCapacity: '',
    acquisitionCost: '',
    region: 'North'
  });
  const [error, setError] = useState('');
  
  const canEdit = user?.role === 'FLEET_MANAGER';

  const fetchVehicles = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter !== 'All') query.append('status', statusFilter);
      if (typeFilter !== 'All') query.append('type', typeFilter);

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
  }, [search, statusFilter, typeFilter, token]);

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
        registrationNumber: '', name: '', model: '', type: 'Light Duty', 
        maxLoadCapacity: '', acquisitionCost: '', region: 'North'
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRetire = async (id: string) => {
    if (!confirm('Are you sure you want to retire this vehicle?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vehicles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVehicles();
      }
    } catch (err) {
      console.error('Failed to retire vehicle');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4 flex-wrap">
          <div className="w-40">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </Select>
          </div>
          <div className="w-40">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Type</label>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="All">All Types</option>
              <option value="Light Duty">Light Duty</option>
              <option value="Medium Duty">Medium Duty</option>
              <option value="Heavy Duty">Heavy Duty</option>
            </Select>
          </div>
          <div className="w-64">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Search vehicle...</label>
            <Input 
              type="text" 
              placeholder="Search by registration or name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={16} />}
              shortcut="⌘K"
            />
          </div>
        </div>
        {canEdit && (
          <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
            Add Vehicle
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>REG NO</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>ODOMETER</TableHead>
              <TableHead>CAPACITY</TableHead>
              <TableHead>STATUS</TableHead>
              {canEdit && <TableHead>ACTIONS</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id} className={v.status === 'RETIRED' ? 'opacity-50' : ''}>
                <TableCell mono className="font-medium text-white">{v.registrationNumber}</TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell className="text-text-muted">{v.type}</TableCell>
                <TableCell mono className="text-text-muted">{v.odometer?.toLocaleString()} km</TableCell>
                <TableCell mono className="text-text-muted">{v.maxLoadCapacity?.toLocaleString()} kg</TableCell>
                <TableCell>
                  <StatusChip status={v.status} domain="vehicle" />
                </TableCell>
                {canEdit && (
                  <TableCell>
                    {v.status !== 'RETIRED' && (
                      <button 
                        onClick={() => handleRetire(v.id)} 
                        className="p-2 text-text-muted hover:text-status-danger transition-colors bg-white/5 hover:bg-status-danger/10 rounded-md"
                        title="Retire Vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-text-muted">
                  No vehicles found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Registration No</label>
              <Input
                required
                value={formData.registrationNumber}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                placeholder="TRK-1000"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Name</label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Truck 1"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Model</label>
              <Input
                required
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
                placeholder="Volvo FH16"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Type</label>
              <Select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Light Duty">Light Duty</option>
                <option value="Medium Duty">Medium Duty</option>
                <option value="Heavy Duty">Heavy Duty</option>
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Max Load (kg)</label>
              <Input
                type="number"
                required
                value={formData.maxLoadCapacity}
                onChange={e => setFormData({ ...formData, maxLoadCapacity: e.target.value })}
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Acquisition Cost</label>
              <Input
                type="number"
                required
                value={formData.acquisitionCost}
                onChange={e => setFormData({ ...formData, acquisitionCost: e.target.value })}
                placeholder="80000"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Region</label>
              <Input
                required
                value={formData.region}
                onChange={e => setFormData({ ...formData, region: e.target.value })}
                placeholder="North"
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
