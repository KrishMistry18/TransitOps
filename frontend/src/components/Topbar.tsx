import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { StatusChip } from './ui';

export function Topbar() {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <header className="h-[64px] border-b border-border bg-bg flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center">
        <div className="flex items-center gap-1.5 text-[0.75rem] text-text-muted">
          <kbd className="border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd> to search pages
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm font-medium text-text-primary">
          {user.name}
        </div>
        <StatusChip status={user.role} domain="role" />
      </div>
    </header>
  );
}
