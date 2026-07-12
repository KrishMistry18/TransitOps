import React, { useState, useEffect, useContext } from 'react';
import { Vehicle } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { 
  Button, Card, Input, Select, Table, TableHeader, TableRow, 
  TableHead, TableBody, TableCell, StatusChip, Modal
} from '../components/ui';
import { SortableHead, sortRows, SortDirection } from '../components/ui/SortableHead';
import { Search, Plus, Trash2, FileText } from 'lucide-react';
import { useDemo } from '../features/demo/DemoContext';

interface VehicleDoc { id: string; typeLabel: string; fileName: string; url: string; uploadedAt: string }

export default function Fleet() {
  const { token, user } = useContext(AuthContext);
  const { completeStep } = useDemo();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [docVehicle, setDocVehicle] = useState<Vehicle | null>(null);
  const [docs, setDocs] = useState<VehicleDoc[]>([]);
  const [docForm, setDocForm] = useState({ typeLabel: 'Registration', fileName: '', url: '' });
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  const sortedVehicles = sortRows(vehicles, sortColumn, sortDirection);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [retireTarget, setRetireTarget] = useState<Vehicle | null>(null);
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
  
  const canEdit = user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER';

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
      completeStep('register-vehicle'); // Req 21.2 step 1
    } catch (err: any) {
      setError(err.message);
    }
  };

  const confirmRetire = async () => {
    if (!retireTarget) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vehicles/${retireTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVehicles();
      }
    } catch (err) {
      console.error('Failed to retire vehicle');
    } finally {
      setRetireTarget(null);
    }
  };

  // ---- Vehicle documents (Req 20) ----
  const openDocs = async (v: Vehicle) => {
    setDocVehicle(v);
    setDocForm({ typeLabel: 'Registration', fileName: '', url: '' });
    const res = await fetch(`http://localhost:5000/api/vehicles/${v.id}/documents`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setDocs(await res.json());
  };

  const addDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docVehicle) return;
    const res = await fetch(`http://localhost:5000/api/vehicles/${docVehicle.id}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(docForm)
    });
    if (res.ok) {
      setDocForm({ typeLabel: 'Registration', fileName: '', url: '' });
      const listRes = await fetch(`http://localhost:5000/api/vehicles/${docVehicle.id}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (listRes.ok) setDocs(await listRes.json());
    }
  };

  const deleteDoc = async (docId: string) => {
    if (!docVehicle) return;
    const res = await fetch(`http://localhost:5000/api/vehicles/${docVehicle.id}/documents/${docId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setDocs(docs.filter(d => d.id !== docId));
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
              <SortableHead label="REG NO" column="registrationNumber" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
              <SortableHead label="NAME" column="name" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
              <SortableHead label="TYPE" column="type" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
              <SortableHead label="ODOMETER" column="odometer" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
              <SortableHead label="CAPACITY" column="maxLoadCapacity" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
              <SortableHead label="STATUS" column="status" activeColumn={sortColumn} direction={sortDirection} onSort={handleSort} />
              <TableHead>ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVehicles.map((v) => (
              <TableRow key={v.id} className={v.status === 'RETIRED' ? 'opacity-50' : ''}>
                <TableCell mono className="font-medium text-white">{v.registrationNumber}</TableCell>
                <TableCell>{v.name}</TableCell>
                <TableCell className="text-text-muted">{v.type}</TableCell>
                <TableCell mono className="text-text-muted">{v.odometer?.toLocaleString()} km</TableCell>
                <TableCell mono className="text-text-muted">{v.maxLoadCapacity?.toLocaleString()} kg</TableCell>
                <TableCell>
                  <StatusChip status={v.status} domain="vehicle" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openDocs(v)}
                      className="p-2 text-text-muted hover:text-accent transition-colors bg-white/5 hover:bg-accent/10 rounded-md"
                      title="Documents"
                    >
                      <FileText size={16} />
                    </button>
                    {canEdit && v.status !== 'RETIRED' && (
                      <button
                        onClick={() => setRetireTarget(v)}
                        className="p-2 text-text-muted hover:text-status-danger transition-colors bg-white/5 hover:bg-status-danger/10 rounded-md"
                        title="Retire Vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
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

      {/* Vehicle Documents Modal (Req 20) */}
      <Modal isOpen={!!docVehicle} onClose={() => setDocVehicle(null)} title={`Documents — ${docVehicle?.registrationNumber ?? ''}`}>
        <div className="space-y-4">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {docs.map(d => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div>
                  <div className="text-sm font-medium text-white">{d.fileName}</div>
                  <div className="text-[0.7rem] text-text-muted uppercase tracking-widest">{d.typeLabel}</div>
                </div>
                {canEdit && (
                  <button onClick={() => deleteDoc(d.id)} className="p-1.5 text-text-muted hover:text-status-danger bg-white/5 hover:bg-status-danger/10 rounded" title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
            {docs.length === 0 && <div className="text-center py-6 text-text-muted text-sm">No documents attached</div>}
          </div>

          {canEdit && (
            <form onSubmit={addDoc} className="border-t border-white/5 pt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Type</label>
                <Select value={docForm.typeLabel} onChange={e => setDocForm({ ...docForm, typeLabel: e.target.value })}>
                  <option value="Registration">Registration</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
              <div>
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">File Name</label>
                <Input required value={docForm.fileName} onChange={e => setDocForm({ ...docForm, fileName: e.target.value })} placeholder="reg-2026.pdf" />
              </div>
              <div className="col-span-2">
                <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">URL (optional)</label>
                <Input value={docForm.url} onChange={e => setDocForm({ ...docForm, url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="col-span-2 flex justify-end">
                <Button type="submit" icon={<Plus size={14} />}>Attach Document</Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Retire Vehicle Confirmation Modal (Finding B fix — replaces native confirm()) */}
      <Modal isOpen={!!retireTarget} onClose={() => setRetireTarget(null)} title="Retire Vehicle">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Are you sure you want to retire{' '}
            <span className="font-semibold text-white">{retireTarget?.name}</span>{' '}
            <span className="font-mono text-white">({retireTarget?.registrationNumber})</span>?
            This will mark the vehicle as retired and remove it from active operations.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRetireTarget(null)}>Cancel</Button>
            <Button onClick={confirmRetire} className="!bg-status-danger hover:!bg-status-danger/80">Retire Vehicle</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
