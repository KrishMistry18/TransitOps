import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { TableHead } from './Table';
import { cn } from './utils';

export type SortDirection = 'asc' | 'desc';

interface SortableHeadProps {
  label: string;
  column: string;
  activeColumn: string;
  direction: SortDirection;
  onSort: (column: string) => void;
  className?: string;
}

/**
 * Clickable table header for Req 14.4 — first click sorts ascending, clicking the
 * same column again toggles to descending.
 */
export function SortableHead({ label, column, activeColumn, direction, onSort, className }: SortableHeadProps) {
  const isActive = activeColumn === column;
  return (
    <TableHead className={cn('cursor-pointer select-none', className)} onClick={() => onSort(column)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
        ) : (
          <ChevronsUpDown size={12} className="opacity-40" />
        )}
      </span>
    </TableHead>
  );
}

/** Generic comparator-based sort helper shared by list pages. */
export function sortRows<T extends Record<string, any>>(rows: T[], column: string, direction: SortDirection): T[] {
  if (!column) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = a[column];
    const bv = b[column];
    if (av == null && bv == null) return 0;
    if (av == null) return -1;
    if (bv == null) return 1;
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    return String(av).localeCompare(String(bv));
  });
  return direction === 'asc' ? sorted : sorted.reverse();
}
