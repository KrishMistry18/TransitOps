import React, { useState, useEffect, useContext } from 'react';
import { Driver } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { cn } from '../components/ui/utils';
import { 
  Button, Card, Input, Select, Table, TableHeader, TableRow, 
  TableHead, TableBody, TableCell, StatusChip, Modal, SafetyScore, Avatar
} from '../components/ui';
import { Search, Plus, AlertCircle } from 'lucide-react';

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
              icon={<Search size={16} />}
              shortcut="⌘K"
            />
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
          Add Driver
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
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name={d.name} />
                      <span className="font-semibold text-[0.9375rem] text-white">{d.name}</span>
                    </div>
                  </TableCell>
                  <TableCell mono className="text-text-muted">{d.licenseNumber}</TableCell>
                  <TableCell className="text-text-muted">{d.licenseCategory}</TableCell>
                  <TableCell mono className={cn("text-text-muted", expired && 'text-status-danger font-bold')}>
                    {new Date(d.licenseExpiryDate).toLocaleDateString()}
                    {expired && ' (EXPIRED)'}
                  </TableCell>
                  <TableCell mono className="text-text-muted">{d.contactNumber}</TableCell>
                  <TableCell>
                    <SafetyScore score={d.safetyScore} />
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

        <div className="mt-8 mb-4">
          <div className="inline-flex items-center gap-2 bg-[#1B212B]/40 backdrop-blur-md rounded-xl p-1.5 border border-white/5 shadow-sm">
            {[
              { label: 'Available', count: totals.available, color: 'bg-status-available' },
              { label: 'On Trip', count: totals.onTrip, color: 'bg-status-pending' },
              { label: 'Off Duty', count: totals.offDuty, color: 'bg-status-inshop' },
              { label: 'Suspended', count: totals.suspended, color: 'bg-status-danger' },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] rounded-[8px] hover:bg-white/[0.04] transition-colors cursor-default">
                  <span className={cn("w-2 h-2 rounded-full", stat.color)} />
                  <span className="text-[0.65rem] font-medium text-text-muted uppercase tracking-[0.06em]">{stat.label}</span>
                  <span className="text-sm font-bold text-white ml-1">{stat.count}</span>
                </div>
                {i < arr.length - 1 && <div className="w-[1px] h-6 bg-white/5" />}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 bg-[#1B212B]/40 backdrop-blur-md border border-white/5 border-l-status-danger/80 p-4 rounded-xl shadow-sm text-sm text-text-primary">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-status-danger/10 shrink-0">
            <AlertCircle className="w-4 h-4 text-status-danger" />
          </div>
          <span><strong className="text-white">Rule:</strong> Expired license or Suspended status &rarr; blocked from trip assignment</span>
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
