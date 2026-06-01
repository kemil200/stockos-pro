'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface DataPoint {
  date: string;
  revenue: number;
}

export function RevenueChart({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ width: '100%', height: 256 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(val: string) => {
              const d = new Date(val);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(val: number) => `${Math.round(val / 1000)}k`} />
          <Tooltip
            formatter={(value: any) => [formatCurrency(value), 'Revenu']}
            labelFormatter={(label: any) => new Date(label).toLocaleDateString('fr-FR')}
          />
          <Bar dataKey="revenue" fill="#059669" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
