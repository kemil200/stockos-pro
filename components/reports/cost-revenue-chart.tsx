'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/utils/currency';

interface DataPoint {
  date: string;
  revenue: number;
  cost: number;
}

export function CostRevenueChart({ data }: { data: DataPoint[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="px-5 py-4 border-b">
        <h2 className="font-heading font-semibold text-base">CA vs Coûts</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Chiffre d&apos;affaires et coût des produits vendus</p>
      </div>
      <div className="p-4">
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                interval={data.length > 20 ? Math.ceil(data.length / 12) : 0}
              />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(val: number) => `${Math.round(val / 1000)}k`} />
              <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), '']} labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} />
              <Legend />
              <Bar dataKey="revenue" name="CA" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="cost" name="Coût" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
