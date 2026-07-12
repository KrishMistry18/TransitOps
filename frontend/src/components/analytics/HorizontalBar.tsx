import React from 'react';

interface BarSegment {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarProps {
  segments: BarSegment[];
  height?: number;
  showLegend?: boolean;
}

export default function HorizontalBar({ segments, height = 28, showLegend = true }: HorizontalBarProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <div className="text-text-muted text-sm text-center py-16">
        No data available
      </div>
    );
  }

  return (
    <div>
      {/* Bar */}
      <div
        className="w-full rounded-[6px] overflow-hidden flex"
        style={{ height: `${height}px` }}
      >
        {segments.map((segment, i) => {
          const pct = (segment.value / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={i}
              className="transition-all duration-500 ease-out relative group"
              style={{
                width: `${pct}%`,
                backgroundColor: segment.color,
                minWidth: pct > 0 ? '2px' : '0',
              }}
              title={`${segment.label}: ${segment.value} (${pct.toFixed(1)}%)`}
            >
              {/* Hover tooltip */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface-raised border border-border rounded-[6px] px-8 py-4 text-[0.75rem] text-text-primary font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-modal z-10">
                {segment.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-x-16 gap-y-8 mt-12">
          {segments.map((segment, i) => (
            <div key={i} className="flex items-center gap-8">
              <span
                className="w-[10px] h-[10px] rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-text-muted text-[0.75rem] font-medium">
                {segment.label}
              </span>
              <span className="text-text-primary font-mono text-[0.8125rem]">
                {segment.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
