import React from 'react';
import { cn } from './utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-[36px] w-full items-center justify-between rounded-[6px] border border-border bg-surface-raised px-3 py-2 text-sm text-text-primary transition-all placeholder:text-text-muted/50 focus:outline-none focus:ring-[2px] focus:ring-accent-primary focus:shadow-[0_0_10px_rgba(91,141,239,0.2)] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Select.displayName = 'Select';
