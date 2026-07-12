import React, { useState, useEffect, useContext } from 'react';
import { Driver } from '@shared/types';
import { AuthContext } from '../context/AuthContext';
import { Card, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, StatusChip, SafetyScore } from '../components/ui';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

function daysUntil(dateStr: string | Date): number {
  const now = new Date();
  const exp = new Date(dateStr);
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * License Expiry Reminders & Compliance Radar (Req 18).
 * Lists drivers whose license expires within the configured window, ordered by expiry asc,
 * with a day countdown. An empty list is treated as a successful, valid state (Req 18.1).
 */
export default function Compliance() {
  const { token } = useContext(AuthContext);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch('http://localhost:5000/api/drivers/expiring-licenses', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDrivers(Array.isArray(data) ? data : []))
      .catch(() => setDrivers([]))
      .finally(() => setLoaded(true));
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-accent" size={20} />
        <h2 className="text-xl font-bold text-white tracking-[0.02em]">Compliance Radar</h2>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-[0.8rem] text-text-muted uppercase tracking-widest">Licenses Expiring Soon</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DRIVER</TableHead>
              <TableHead>LICENSE NO</TableHead>
              <TableHead>EXPIRY</TableHead>
              <TableHead>COUNTDOWN</TableHead>
              <TableHead>SAFETY</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => {
              const days = daysUntil(d.licenseExpiryDate);
              const expired = days < 0;
              return (
                <TableRow key={d.id} className={expired ? 'border-l-4 border-l-status-danger' : ''}>
                  <TableCell className="font-medium text-white">{d.name}</TableCell>
                  <TableCell mono className="text-text-muted">{d.licenseNumber}</TableCell>
                  <TableCell mono className="text-text-muted">{new Date(d.licenseExpiryDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={expired ? 'inline-flex items-center gap-1 text-status-danger font-semibold text-sm' : days <= 7 ? 'text-status-pending font-semibold text-sm' : 'text-white text-sm'}>
                      {expired ? (<><AlertTriangle size={12} /> Expired {Math.abs(days)}d ago</>) : `${days} day${days === 1 ? '' : 's'} left`}
                    </span>
                  </TableCell>
                  <TableCell><SafetyScore score={d.safetyScore} /></TableCell>
                  <TableCell><StatusChip status={d.status} domain="driver" /></TableCell>
                </TableRow>
              );
            })}
            {loaded && drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-status-available">
                  ✓ All licenses are compliant — none expiring within the reminder window
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
