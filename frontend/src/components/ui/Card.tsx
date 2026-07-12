import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: string;
}

export function Card({ className, accent, children, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[16px] backdrop-blur-[12px] bg-[#1B212B]/60 border border-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden",
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
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <div className="relative z-10 p-16 sm:p-24">
        {children}
      </div>
    </div>
  );
}
