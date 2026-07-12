import React from 'react';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', icon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-[6px] font-medium transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-gradient-to-br from-accent-primary to-[#7B61FF] text-white shadow-[0_4px_14px_rgba(91,141,239,0.4)] hover:shadow-[0_6px_20px_rgba(91,141,239,0.6)] hover:-translate-y-[1px]": variant === 'primary',
            "bg-surface-raised border border-border text-text-primary hover:bg-surface": variant === 'secondary',
            "bg-status-danger text-white hover:brightness-110": variant === 'danger',
            "bg-transparent text-text-primary hover:bg-surface-raised": variant === 'ghost',
            "h-8 px-3 text-sm": size === 'sm',
            "h-[36px] px-4 text-sm": size === 'md',
          },
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
