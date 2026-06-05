'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface DataPoint {
  date: string;
  revenue: number;
}

export function RevenueChart({ data, period }: { data: DataPoint[]; period: string }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div style={{ width: '100%', height: 256 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            interval={period === 'month' && data.length > 15 ? 2 : period === 'year' ? 1 : 0}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(val: number) => `${Math.round(val / 1000)}k`} />
          <Tooltip
            formatter={(value: any) => [formatCurrency(Number(value)), 'CA']}
            labelFormatter={(label) => `${label}`}
          />
          <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      {total > 0 && (
        <p className="text-center text-xs text-zinc-400 mt-2">
          CA total : {formatCurrency(total)}
        </p>
      )}
    </div>
  );
}
