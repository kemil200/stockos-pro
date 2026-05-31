import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card className="border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm text-zinc-500 font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
            {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
          </div>
          <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
            <Icon className="size-5 text-zinc-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
