import React from 'react';
import { cn } from './utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-[6px] font-medium transition-colors focus:outline-none focus:ring-[2px] focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-accent-primary text-white hover:bg-accent-primary-hover": variant === 'primary',
            "bg-surface-raised border border-border text-text-primary hover:bg-surface": variant === 'secondary',
            "bg-status-danger text-white hover:opacity-90": variant === 'danger',
            "bg-transparent text-text-primary hover:bg-surface-raised": variant === 'ghost',
            "h-8 px-12 text-sm": size === 'sm', // Using the exact px values from scale: 12px padding
            "h-[36px] px-16 text-sm": size === 'md', // Using 16px padding
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
