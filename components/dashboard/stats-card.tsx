import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  accent?: string;
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
            {subtitle && <p className="text-xs text-zinc-400">{subtitle}</p>}
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

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
