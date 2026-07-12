import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Settings() {
  const { token, user } = useContext(AuthContext);
  const [settings, setSettings] = useState({ depotName: '', currency: '', distanceUnit: '' });
  const [permissions, setPermissions] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setSettings(data));

    fetch('http://localhost:5000/api/settings/permissions', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setPermissions(data));
  }, [token]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('http://localhost:5000/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) setMessage('Settings saved successfully');
      else setMessage('Error saving settings or insufficient permissions');
    } catch (err) {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage global depot preferences and view role permissions.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">General Configuration</h3>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          {message && <div className="text-sm font-medium text-blue-600">{message}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700">Depot Name</label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
              value={settings.depotName}
              onChange={e => setSettings({ ...settings, depotName: e.target.value })}
              disabled={user?.role !== 'FLEET_MANAGER'}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Currency</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                disabled={user?.role !== 'FLEET_MANAGER'}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Distance Unit</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 focus:ring-blue-500 focus:border-blue-500"
                value={settings.distanceUnit}
                onChange={e => setSettings({ ...settings, distanceUnit: e.target.value })}
                disabled={user?.role !== 'FLEET_MANAGER'}
              >
                <option value="km">Kilometers (km)</option>
                <option value="mi">Miles (mi)</option>
              </select>
            </div>
          </div>
          {user?.role === 'FLEET_MANAGER' && (
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Role-Based Access Control (RBAC) Matrix</h3>
        {permissions ? (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 bg-gray-50">Feature / Module</th>
                {Object.keys(permissions).map(role => (
                  <th key={role} className="px-4 py-3 text-center font-medium text-gray-500 bg-gray-50">
                    {role.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {['fleet', 'drivers', 'trips', 'fuelExp', 'analytics'].map(feature => (
                <tr key={feature}>
                  <td className="px-4 py-3 font-medium text-gray-900 capitalize">
                    {feature === 'fuelExp' ? 'Fuel & Expenses' : feature}
                  </td>
                  {Object.keys(permissions).map(role => {
                    const access = permissions[role][feature];
                    return (
                      <td key={`${role}-${feature}`} className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                          ${access === 'full' ? 'bg-green-100 text-green-800' :
                            access === 'view' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {access}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-sm text-gray-500">Loading matrix...</div>
        )}
      </div>
    </div>
  );
}
