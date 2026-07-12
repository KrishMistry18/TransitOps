import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface MiniBarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  dataKey?: string;
  nameKey?: string;
  barColor?: string;
  height?: number;
  formatValue?: (value: number) => string;
  layout?: 'vertical' | 'horizontal';
}

const CustomTooltip = ({ active, payload, label, formatValue }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-raised border border-border rounded-[6px] px-12 py-8 shadow-modal">
      <p className="text-text-muted text-[0.75rem] font-medium uppercase tracking-[0.04em] mb-4">
        {label}
      </p>
      <p className="text-text-primary font-display font-bold text-[1.125rem]">
        {formatValue ? formatValue(payload[0].value) : payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export default function MiniBarChart({
  data,
  dataKey = 'value',
  nameKey = 'name',
  barColor = '#5B8DEF',
  height = 280,
  formatValue,
  layout = 'horizontal',
}: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#2B333F"
          vertical={layout === 'vertical'}
          horizontal={layout === 'horizontal'}
        />
        {layout === 'horizontal' ? (
          <>
            <XAxis
              dataKey={nameKey}
              tick={{ fill: '#8A93A3', fontSize: 12, fontFamily: 'Inter' }}
              axisLine={{ stroke: '#2B333F' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8A93A3', fontSize: 12, fontFamily: '"JetBrains Mono"' }}
              axisLine={{ stroke: '#2B333F' }}
              tickLine={false}
              tickFormatter={(v) => formatValue ? formatValue(v) : v.toLocaleString()}
            />
          </>
        ) : (
          <>
            <XAxis
              type="number"
              tick={{ fill: '#8A93A3', fontSize: 12, fontFamily: '"JetBrains Mono"' }}
              axisLine={{ stroke: '#2B333F' }}
              tickLine={false}
              tickFormatter={(v) => formatValue ? formatValue(v) : v.toLocaleString()}
            />
            <YAxis
              type="category"
              dataKey={nameKey}
              tick={{ fill: '#8A93A3', fontSize: 12, fontFamily: 'Inter' }}
              axisLine={{ stroke: '#2B333F' }}
              tickLine={false}
              width={100}
            />
          </>
        )}
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} />}
          cursor={{ fill: 'rgba(91, 141, 239, 0.08)' }}
        />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color || barColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
