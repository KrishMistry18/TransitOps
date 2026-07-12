import React from 'react';
import { Card } from './Card';
import { cn } from './utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  accent?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function KPICard({ label, value, accent, trend, trendValue, className }: KPICardProps) {
  return (
    <Card accent={accent} className={cn("flex flex-col justify-between", className)}>
      <div className="text-text-muted text-[0.75rem] font-medium uppercase tracking-[0.04em] mb-8">
        {label}
      </div>
      <div className="flex items-end justify-between">
        <div className="text-[2rem] font-display font-bold text-text-primary leading-none">
          {value}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center text-sm font-medium",
            {
              "text-status-available": trend === 'up',
              "text-status-danger": trend === 'down',
              "text-status-inshop": trend === 'neutral',
            }
          )}>
            {trend === 'up' && <TrendingUp className="w-4 h-4 mr-1" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
            {trend === 'neutral' && <Minus className="w-4 h-4 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
    </Card>
  );
}
