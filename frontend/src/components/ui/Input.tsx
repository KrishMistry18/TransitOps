import React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  shortcut?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, shortcut, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/70">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-[36px] w-full rounded-[10px] border border-border bg-surface-raised shadow-inner py-1 text-sm text-text-primary transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted/50 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-accent-primary focus-visible:shadow-[0_0_12px_rgba(91,141,239,0.3)] focus-visible:bg-[#2A3441] disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-9" : "pl-3",
            shortcut ? "pr-12" : "pr-3",
            className
          )}
          ref={ref}
          {...props}
        />
        {shortcut && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <kbd className="inline-flex items-center justify-center rounded-[4px] border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-text-muted shadow-sm">
              {shortcut}
            </kbd>
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
