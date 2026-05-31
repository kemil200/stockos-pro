import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent,
  trend,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  accent?: string;
  trend?: { value: string; direction: 'up' | 'down' };
}) {
  return (
    <Card className="border-zinc-200/80 shadow-sm hover:shadow-md transition-all duration-200 hover:border-zinc-300">
      <CardContent className="p-5 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm text-zinc-500 font-medium truncate">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold font-heading tracking-tight text-zinc-900 break-all">
              {value}
            </p>
            <div className="flex items-center gap-2">
              {trend && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-medium',
                  trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500',
                )}>
                  {trend.direction === 'up' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {trend.value}
                </span>
              )}
              {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
            </div>
          </div>
          <div className={cn(
            'size-11 rounded-xl flex items-center justify-center shrink-0',
            accent || 'bg-zinc-100',
          )}>
            <Icon className={cn('size-5', accent ? 'text-white' : 'text-zinc-600')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
