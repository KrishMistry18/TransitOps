import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: string;
}

export function Card({ className, accent, children, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[10px] overflow-hidden relative",
        className
      )}
      style={style}
      {...props}
    >
      {accent && (
        <div 
          className="absolute top-0 left-0 right-0 h-[3px]" 
          style={{ backgroundColor: accent }} 
        />
      )}
      <div className="p-16 sm:p-24">
        {children}
      </div>
    </div>
  );
}
