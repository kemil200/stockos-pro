import { type LucideIcon } from 'lucide-react';

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-6 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{title}</p>
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
    </div>
  );
}
