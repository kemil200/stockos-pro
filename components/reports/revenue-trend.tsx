'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface DataPoint {
  date: string;
  revenue: number;
  count: number;
}

export function RevenueTrend({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.revenue, 0);
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-heading font-semibold text-base">Tendance CA</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Évolution journalière</p>
      </div>

      <div className="p-4">
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                interval={data.length > 20 ? Math.ceil(data.length / 12) : 0}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickFormatter={(val: number) => `${Math.round(val / 1000)}k`}
                domain={[0, Math.ceil(maxRevenue * 1.15)]}
              />
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value)), 'CA']}
                labelFormatter={(label) => new Date(String(label)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={data.length <= 31}
                activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-3 px-2">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">CA journalier</span>
          </div>
          <p className="text-xs font-medium text-zinc-600">
            {data.length} jour(s) — Total : {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
}
