import React from 'react';
import { cn } from './utils';

interface SafetyScoreProps {
  score: number;
  className?: string;
}

export function SafetyScore({ score, className }: SafetyScoreProps) {
  const radius = 13;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(score, 0), 100) / 100) * circumference;

  let textColor = 'text-status-danger';
  if (score >= 90) textColor = 'text-status-available';
  else if (score >= 70) textColor = 'text-status-pending';

  return (
    <div className={cn("relative flex items-center justify-center w-[32px] h-[32px]", className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
        <circle 
          className="text-surface-raised stroke-current" 
          strokeWidth="3" 
          cx="16" cy="16" r={radius} 
          fill="transparent" 
        />
        <circle 
          className={cn("stroke-current transition-all duration-1000 ease-out", textColor)}
          strokeWidth="3" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round"
          cx="16" cy="16" r={radius} 
          fill="transparent" 
        />
      </svg>
      <span className="absolute text-[0.6rem] font-bold font-display tracking-tighter text-text-primary">
        {score}
      </span>
    </div>
  );
}
