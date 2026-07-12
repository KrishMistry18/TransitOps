import React from 'react';
import { cn } from './utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: string;
}

export function Card({ className, accent, children, style, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[16px] backdrop-blur-[12px] bg-[rgba(27,33,43,0.6)] shadow-[0_20px_60px_rgba(0,0,0,0.4)] overflow-hidden",
        "border border-t-white/10 border-l-white/5 border-r-white/5 border-b-black/20",
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
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}
