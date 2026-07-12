import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PermissionsMatrix, FeaturePermissions } from '@shared/types';
import { Card, Input, Select, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, StatusChip } from '../components/ui';
import api from '../lib/api';
import { useDemo } from '../features/demo/DemoContext';
import { Sparkles } from 'lucide-react';

export default function Settings() {
  const { user } = useContext(AuthContext);
  const { active: demoActive, start: startDemo, isComplete: demoComplete } = useDemo();
  const [settings, setSettings] = useState({ depotName: '', currency: '', distanceUnit: '' });
  const [permissions, setPermissions] = useState<PermissionsMatrix | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(res.data))
      .catch(() => setMessage('Error loading settings'));

    api.get('/settings/permissions')
      .then(res => setPermissions(res.data))
      .catch(() => setMessage('Error loading permissions'));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await api.put('/settings', settings);
      setSettings(res.data);
      setMessage('Settings saved successfully');
    } catch (err) {
      setMessage('Error saving settings or insufficient permissions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-[1.5rem] font-display font-bold text-text-primary">Platform Settings</h1>
        <p className="text-text-muted text-[0.875rem] mt-1">Manage global depot preferences and view role permissions.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[1.125rem] font-display font-semibold text-text-primary">Guided Demo Mode</h3>
            <p className="text-text-muted text-[0.875rem] mt-1">
              Walk through register vehicle → register driver → create trip → dispatch → complete → maintenance → reports, in order (Req 21).
            </p>
          </div>
          <Button icon={<Sparkles size={16} />} onClick={startDemo} disabled={demoActive}>
            {demoActive ? (demoComplete ? 'Demo Complete' : 'Demo In Progress…') : 'Start Demo'}
          </Button>
        </div>
      </Card>

      <Card accent="#8A93A3">
        <h3 className="text-[1.125rem] font-display font-semibold text-text-primary mb-6">General Configuration</h3>
        <form onSubmit={handleSave} className="space-y-6 max-w-md">
          {message && (
            <div className="text-[0.875rem] font-medium text-status-available bg-status-available/10 p-3 rounded-[6px]">
              {message}
            </div>
          )}
          <div>
            <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Depot Name</label>
            <Input
              type="text"
              value={settings.depotName}
              onChange={e => setSettings({ ...settings, depotName: e.target.value })}
              disabled={user?.role !== 'ADMIN' && user?.role !== 'FLEET_MANAGER'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Currency</label>
              <Select
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                disabled={user?.role !== 'ADMIN' && user?.role !== 'FLEET_MANAGER'}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Distance Unit</label>
              <Select
                value={settings.distanceUnit}
                onChange={e => setSettings({ ...settings, distanceUnit: e.target.value })}
                disabled={user?.role !== 'ADMIN' && user?.role !== 'FLEET_MANAGER'}
              >
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </Select>
            </div>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'FLEET_MANAGER') && (
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
          )}
        </form>
      </Card>

      <Card>
        <h3 className="text-[1.125rem] font-display font-semibold text-text-primary mb-6">Role-Based Access Control (RBAC) Matrix</h3>
        {permissions ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature / Module</TableHead>
                {Object.keys(permissions).map(role => (
                   <TableHead key={role} className="text-center">
                     {role.replace('_', ' ')}
                   </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {['fleet', 'drivers', 'trips', 'fuelExp', 'analytics'].map(feature => (
                <TableRow key={feature}>
                  <TableCell className="font-medium capitalize">
                    {feature === 'fuelExp' ? 'Fuel & Expenses' : feature}
                  </TableCell>
                  {Object.keys(permissions).map(role => {
                    const access = permissions[role][feature as keyof FeaturePermissions];
                    return (
                      <TableCell key={`${role}-${feature}`} className="text-center">
                        <StatusChip 
                          status={access} 
                          domain="role" 
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-[0.875rem] text-text-muted">Loading matrix...</div>
        )}
      </Card>
    </div>
  );
}
