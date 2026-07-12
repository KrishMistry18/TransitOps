import React, { useState, useEffect, useContext } from 'react';
import { Driver } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, Card, Input, Select, Table, TableHeader, TableRow, 
  TableHead, TableBody, TableCell, StatusChip, Modal 
} from '../components/ui';

export default function Drivers() {
  const { token } = useContext(AuthContext);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'LMV',
    licenseExpiryDate: '',
    contactNumber: ''
  });
  const [error, setError] = useState('');

  const fetchDrivers = async () => {
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (statusFilter !== 'All') query.append('status', statusFilter);

      const res = await fetch(`http://localhost:5000/api/drivers?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [search, statusFilter, token]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to add driver');
      }
      
      setShowAddModal(false);
      fetchDrivers();
      setFormData({
        name: '', licenseNumber: '', licenseCategory: 'LMV', 
        licenseExpiryDate: '', contactNumber: ''
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const isExpired = (dateString: string | Date) => {
    return new Date(dateString) < new Date();
  };

  const totals = {
    available: drivers.filter(d => d.status === 'AVAILABLE').length,
    onTrip: drivers.filter(d => d.status === 'ON_TRIP').length,
    offDuty: drivers.filter(d => d.status === 'OFF_DUTY').length,
    suspended: drivers.filter(d => d.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-4 flex-wrap">
          <div className="w-48">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Status</label>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
          </div>
          <div className="w-64">
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Search driver...</label>
            <Input 
              type="text" 
              placeholder="Search by name or license..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          + Add Driver
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DRIVER</TableHead>
              <TableHead>LICENSE NO</TableHead>
              <TableHead>CATEGORY</TableHead>
              <TableHead>EXPIRY</TableHead>
              <TableHead>CONTACT</TableHead>
              <TableHead>SAFETY</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => {
              const expired = isExpired(d.licenseExpiryDate);
              return (
                <TableRow key={d.id} className={expired ? 'border-l-4 border-l-status-danger' : ''}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell mono>{d.licenseNumber}</TableCell>
                  <TableCell>{d.licenseCategory}</TableCell>
                  <TableCell mono className={expired ? 'text-status-danger font-bold' : ''}>
                    {new Date(d.licenseExpiryDate).toLocaleDateString()}
                    {expired && ' (EXPIRED)'}
                  </TableCell>
                  <TableCell mono>{d.contactNumber}</TableCell>
                  <TableCell>
                    <StatusChip status={d.safetyScore >= 90 ? 'AVAILABLE' : (d.safetyScore >= 70 ? 'IN_SHOP' : 'RETIRED')} domain="vehicle" />
                    <span className="ml-2 text-[0.875rem]">{d.safetyScore}%</span>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={d.status} domain="driver" />
                  </TableCell>
                </TableRow>
              );
            })}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-text-muted">
                  No drivers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-6 flex gap-4 flex-wrap items-center">
          <span className="text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em]">Toggle Status</span>
          <StatusChip status="AVAILABLE" domain="driver" /> <span className="text-text-muted text-[0.875rem] ml-1">{totals.available}</span>
          <StatusChip status="ON_TRIP" domain="driver" /> <span className="text-text-muted text-[0.875rem] ml-1">{totals.onTrip}</span>
          <StatusChip status="OFF_DUTY" domain="driver" /> <span className="text-text-muted text-[0.875rem] ml-1">{totals.offDuty}</span>
          <StatusChip status="SUSPENDED" domain="driver" /> <span className="text-text-muted text-[0.875rem] ml-1">{totals.suspended}</span>
        </div>
        <div className="mt-4 text-[0.75rem] text-text-muted">
          Rule: Expired license or Suspended status â†’ blocked from trip assignment
        </div>
      </Card>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Driver"
      >
        <form onSubmit={handleAddDriver} className="space-y-4">
          {error && <div className="text-status-danger text-sm">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Driver Name</label>
              <Input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">License No</label>
              <Input
                required
                value={formData.licenseNumber}
                onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Category</label>
              <Select
                value={formData.licenseCategory}
                onChange={e => setFormData({ ...formData, licenseCategory: e.target.value })}
              >
                <option value="LMV">LMV</option>
                <option value="HMV">HMV</option>
                <option value="CDL">CDL</option>
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Expiry Date</label>
              <Input
                type="date"
                required
                value={formData.licenseExpiryDate}
                onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Contact No</label>
              <Input
                required
                value={formData.contactNumber}
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
              />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">Save Driver</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
