import React, { useState, useEffect, useContext } from 'react';
import { FuelLog, Expense, Vehicle } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import {
  Button, Card, Input, Select, Table, TableHeader, TableRow,
  TableHead, TableBody, TableCell, Modal
} from '../components/ui';
import { Plus, Fuel, Receipt, TrendingUp } from 'lucide-react';

type FuelLogPopulated = FuelLog & { vehicle?: Pick<Vehicle, 'id' | 'name' | 'registrationNumber'> };
type ExpensePopulated = Expense & { vehicle?: Pick<Vehicle, 'id' | 'name' | 'registrationNumber'> };

export default function Fuel() {
  const { token, user } = useContext(AuthContext);
  const canManage = user?.role === 'FINANCIAL_ANALYST';
  const canView = user?.role === 'FINANCIAL_ANALYST' || user?.role === 'FLEET_MANAGER';

  const [fuelLogs, setFuelLogs] = useState<FuelLogPopulated[]>([]);
  const [expenses, setExpenses] = useState<ExpensePopulated[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filterVehicle, setFilterVehicle] = useState('');

  const [showFuel, setShowFuel] = useState(false);
  const [showExpense, setShowExpense] = useState(false);

  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
  const [expenseForm, setExpenseForm] = useState({ vehicleId: '', type: 'TOLL', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [fuelError, setFuelError] = useState('');
  const [expenseError, setExpenseError] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAll = async () => {
    const params = filterVehicle ? `?vehicleId=${filterVehicle}` : '';
    const [fRes, eRes, vRes] = await Promise.all([
      fetch(`http://localhost:5000/api/fuel-logs${params}`, { headers }),
      fetch(`http://localhost:5000/api/expenses${params}`, { headers }),
      fetch('http://localhost:5000/api/vehicles', { headers }),
    ]);
    if (fRes.ok) setFuelLogs(await fRes.json());
    if (eRes.ok) setExpenses(await eRes.json());
    if (vRes.ok) setVehicles(await vRes.json());
  };

  useEffect(() => { fetchAll(); }, [token, filterVehicle]);

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError('');
    const res = await fetch('http://localhost:5000/api/fuel-logs', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...fuelForm, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) }),
    });
    const data = await res.json();
    if (!res.ok) return setFuelError(data.message || 'Failed to log fuel');
    setShowFuel(false);
    setFuelForm({ vehicleId: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
    fetchAll();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpenseError('');
    const res = await fetch('http://localhost:5000/api/expenses', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expenseForm, amount: Number(expenseForm.amount) }),
    });
    const data = await res.json();
    if (!res.ok) return setExpenseError(data.message || 'Failed to add expense');
    setShowExpense(false);
    setExpenseForm({ vehicleId: '', type: 'TOLL', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    fetchAll();
  };

  // Per-vehicle operational cost summary
  const vehicleCosts = vehicles.map(v => {
    const fuelCost = fuelLogs.filter(f => (f.vehicle as any)?.id === v.id || (f as any).vehicle === v.id).reduce((s, f) => s + (f.cost || 0), 0);
    const expCost = expenses.filter(ex => (ex.vehicle as any)?.id === v.id || (ex as any).vehicle === v.id).reduce((s, ex) => s + (ex.amount || 0), 0);
    return { vehicle: v, fuelCost, expCost, total: fuelCost + expCost };
  }).filter(vc => vc.total > 0);

  const totalFuel = fuelLogs.reduce((s, f) => s + (f.cost || 0), 0);
  const totalExp = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        You don't have permission to view fuel & expenses.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Fuel Cost', value: `₹${totalFuel.toLocaleString()}`, icon: <Fuel size={18} className="text-accent" /> },
          { label: 'Total Expenses', value: `₹${totalExp.toLocaleString()}`, icon: <Receipt size={18} className="text-status-pending" /> },
          { label: 'Operational Cost', value: `₹${(totalFuel + totalExp).toLocaleString()}`, icon: <TrendingUp size={18} className="text-status-danger" /> },
        ].map(({ label, value, icon }) => (
          <Card key={label} className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-white/5">{icon}</div>
            <div>
              <div className="text-[0.7rem] text-text-muted uppercase tracking-widest">{label}</div>
              <div className="text-xl font-bold text-white mt-0.5">{value}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Vehicle filter */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Filter by Vehicle</label>
          <Select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
            <option value="">All Vehicles</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Logs */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[1rem] font-semibold text-white uppercase tracking-[0.04em] flex items-center gap-2">
              <Fuel size={16} className="text-accent" /> Fuel Logs
            </h3>
            {canManage && (
              <Button icon={<Plus size={14} />} onClick={() => { setShowFuel(true); setFuelError(''); }}>
                Log Fuel
              </Button>
            )}
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VEHICLE</TableHead>
                  <TableHead>LITERS</TableHead>
                  <TableHead>COST</TableHead>
                  <TableHead>DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fuelLogs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {(log.vehicle as any)?.name || '—'}
                    </TableCell>
                    <TableCell mono className="text-text-muted">{log.liters} L</TableCell>
                    <TableCell mono className="text-text-muted">₹{log.cost?.toLocaleString()}</TableCell>
                    <TableCell mono className="text-text-muted text-xs">
                      {new Date(log.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {fuelLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-text-muted">No fuel logs</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Expenses */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[1rem] font-semibold text-white uppercase tracking-[0.04em] flex items-center gap-2">
              <Receipt size={16} className="text-status-pending" /> Expenses
            </h3>
            {canManage && (
              <Button icon={<Plus size={14} />} onClick={() => { setShowExpense(true); setExpenseError(''); }}>
                Add Expense
              </Button>
            )}
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VEHICLE</TableHead>
                  <TableHead>TYPE</TableHead>
                  <TableHead>AMOUNT</TableHead>
                  <TableHead>DATE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map(exp => (
                  <TableRow key={exp.id}>
                    <TableCell className="text-sm">
                      {(exp.vehicle as any)?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-medium bg-white/5 text-text-muted uppercase">
                        {exp.type}
                      </span>
                    </TableCell>
                    <TableCell mono className="text-text-muted">₹{exp.amount?.toLocaleString()}</TableCell>
                    <TableCell mono className="text-text-muted text-xs">
                      {new Date(exp.date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-text-muted">No expenses</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Per-Vehicle Cost Breakdown */}
      {vehicleCosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[1rem] font-semibold text-white uppercase tracking-[0.04em] flex items-center gap-2">
            <TrendingUp size={16} className="text-status-danger" /> Operational Cost per Vehicle
          </h3>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VEHICLE</TableHead>
                  <TableHead>REG NO</TableHead>
                  <TableHead>FUEL COST</TableHead>
                  <TableHead>EXPENSES</TableHead>
                  <TableHead>TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleCosts.sort((a, b) => b.total - a.total).map(vc => (
                  <TableRow key={vc.vehicle.id}>
                    <TableCell className="font-medium text-white">{vc.vehicle.name}</TableCell>
                    <TableCell mono className="text-text-muted">{vc.vehicle.registrationNumber}</TableCell>
                    <TableCell mono className="text-text-muted">₹{vc.fuelCost.toLocaleString()}</TableCell>
                    <TableCell mono className="text-text-muted">₹{vc.expCost.toLocaleString()}</TableCell>
                    <TableCell mono className="text-white font-semibold">₹{vc.total.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Log Fuel Modal */}
      <Modal isOpen={showFuel} onClose={() => setShowFuel(false)} title="Log Fuel">
        <form onSubmit={handleAddFuel} className="space-y-4">
          {fuelError && <div className="text-status-danger text-sm bg-status-danger/10 rounded p-2">{fuelError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Vehicle</label>
              <Select required value={fuelForm.vehicleId} onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Liters</label>
              <Input type="number" required min="0" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} placeholder="50" />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Cost (₹)</label>
              <Input type="number" required min="0" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} placeholder="3500" />
            </div>
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Date</label>
              <Input type="date" required value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowFuel(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={showExpense} onClose={() => setShowExpense(false)} title="Add Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          {expenseError && <div className="text-status-danger text-sm bg-status-danger/10 rounded p-2">{expenseError}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Vehicle</label>
              <Select required value={expenseForm.vehicleId} onChange={e => setExpenseForm({ ...expenseForm, vehicleId: e.target.value })}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>)}
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Type</label>
              <Select value={expenseForm.type} onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                <option value="TOLL">Toll</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Amount (₹)</label>
              <Input type="number" required min="0" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="500" />
            </div>
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Description</label>
              <Input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="NH-44 highway toll" />
            </div>
            <div className="col-span-2">
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Date</label>
              <Input type="date" required value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowExpense(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
