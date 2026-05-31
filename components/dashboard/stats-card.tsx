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
    <Card>
      <CardContent className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
          <Icon className="size-5 text-zinc-600" />
        </div>
      </CardContent>
    </Card>
  );
}
