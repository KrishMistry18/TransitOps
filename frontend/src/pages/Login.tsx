import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, Input, Select, Button } from '../components/ui';

export default function Login() {
  const { login, user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DISPATCHER'); // Cosmetic only
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-text-primary font-display font-bold text-3xl tracking-wide text-center">TransitOps</h1>
      </div>
      <Card className="max-w-md w-full shadow-modal">
        <div>
          <h2 className="text-center text-[1.5rem] font-display font-bold text-text-primary">
            Sign in
          </h2>
          <p className="mt-2 text-center text-[0.875rem] text-text-muted">
            Access the control center
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-status-danger/10 border border-status-danger/30 p-4 rounded-[6px]">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-status-danger mr-2 shrink-0" />
                <p className="text-sm text-status-danger font-medium">{error}</p>
              </div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Role (Cosmetic)</label>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
              </Select>
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Email address</label>
              <Input
                type="email"
                required
                placeholder="dispatcher@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[0.75rem] font-medium text-text-muted uppercase tracking-[0.04em] mb-1">Password</label>
              <Input
                type="password"
                required
                placeholder="password123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-accent-primary focus:ring-accent-primary border-border bg-surface-raised rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-text-muted">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <button type="button" disabled className="font-medium text-accent-primary hover:text-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Forgot your password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
