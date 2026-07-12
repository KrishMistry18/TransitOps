import React from 'react';
import { cn } from './utils';

export type StatusDomain = 'vehicle' | 'driver' | 'trip' | 'maintenance' | 'role';

interface StatusChipProps {
  status: string;
  domain?: StatusDomain;
  className?: string;
}

export function StatusChip({ status, domain, className }: StatusChipProps) {
  // Normalize status string
  const normalizedStatus = status.toUpperCase().replace('_', ' ');

  // Determine color category based on status string
  let colorCategory = 'inshop'; // default grey
  
  const greenStatuses = ['AVAILABLE', 'COMPLETED', 'SUCCESS', 'ACTIVE', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'];
  const amberStatuses = ['ON TRIP', 'PENDING', 'DISPATCHED', 'IN PROGRESS'];
  const redStatuses = ['RETIRED', 'SUSPENDED', 'EXPIRED', 'CANCELLED'];
  const greyStatuses = ['IN SHOP', 'OFF DUTY', 'DRAFT', 'CLOSED'];

  // Some roles might just use default grey or primary, but let's map roles to green for active
  if (greenStatuses.includes(normalizedStatus)) colorCategory = 'available';
  else if (amberStatuses.includes(normalizedStatus)) colorCategory = 'pending';
  else if (redStatuses.includes(normalizedStatus)) colorCategory = 'danger';
  else if (greyStatuses.includes(normalizedStatus)) colorCategory = 'inshop';

  return (
    <div className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 border text-[0.75rem] font-mono whitespace-nowrap uppercase tracking-[0.04em]",
      {
        "bg-status-available/12 text-status-available border-status-available/30": colorCategory === 'available',
        "bg-status-pending/12 text-status-pending border-status-pending/30": colorCategory === 'pending',
        "bg-status-danger/12 text-status-danger border-status-danger/30": colorCategory === 'danger',
        "bg-status-inshop/12 text-status-inshop border-status-inshop/30": colorCategory === 'inshop',
      },
      className
    )}>
      <span className="relative flex h-1.5 w-1.5 mr-1.5 items-center justify-center">
        {normalizedStatus === 'ON TRIP' && (
          <span className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75 motion-safe:pulse-live",
            {
              "bg-status-available": colorCategory === 'available',
              "bg-status-pending": colorCategory === 'pending',
              "bg-status-danger": colorCategory === 'danger',
              "bg-status-inshop": colorCategory === 'inshop',
            }
          )} />
        )}
        <span className={cn(
          "relative inline-flex rounded-full h-1.5 w-1.5",
          {
            "bg-status-available": colorCategory === 'available',
            "bg-status-pending": colorCategory === 'pending',
            "bg-status-danger": colorCategory === 'danger',
            "bg-status-inshop": colorCategory === 'inshop',
          }
        )} aria-hidden="true" />
      </span>
      {normalizedStatus}
    </div>
  );
}
