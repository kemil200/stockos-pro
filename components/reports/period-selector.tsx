'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { CalendarDays, Calendar, CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PeriodType = 'day' | 'month' | 'year' | 'custom';

const PERIOD_OPTIONS: { value: PeriodType; label: string; icon: typeof CalendarDays }[] = [
  { value: 'day', label: 'Jour', icon: CalendarDays },
  { value: 'month', label: 'Mois', icon: Calendar },
  { value: 'year', label: 'Année', icon: CalendarRange },
  { value: 'custom', label: 'Perso', icon: CalendarRange },
];

function formatDateLocal(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = (searchParams.get('period') as PeriodType) || 'month';
  const dateParam = searchParams.get('date');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const [customFrom, setCustomFrom] = useState(fromParam || formatDateLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [customTo, setCustomTo] = useState(toParam || formatDateLocal(new Date()));

  const navigate = useCallback((params: URLSearchParams) => {
    router.push(`/reports?${params.toString()}`);
  }, [router]);

  const setPeriod = useCallback((type: PeriodType) => {
    const params = new URLSearchParams();
    params.set('period', type);

    const now = new Date();
    switch (type) {
      case 'day':
        params.set('date', formatDateLocal(now));
        break;
      case 'month':
        params.set('date', `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        break;
      case 'year':
        params.set('date', String(now.getFullYear()));
        break;
      case 'custom':
        params.set('from', customFrom);
        params.set('to', customTo);
        break;
    }
    navigate(params);
  }, [navigate, customFrom, customTo]);

  const shiftDate = useCallback((direction: -1 | 1) => {
    const params = new URLSearchParams(searchParams.toString());
    const d = dateParam ? new Date(dateParam.length === 7 ? dateParam + '-01' : dateParam.length === 4 ? dateParam + '-01-01' : dateParam) : new Date();

    switch (period) {
      case 'day':
        d.setDate(d.getDate() + direction);
        params.set('date', formatDateLocal(d));
        break;
      case 'month':
        d.setMonth(d.getMonth() + direction);
        params.set('date', `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        break;
      case 'year':
        d.setFullYear(d.getFullYear() + direction);
        params.set('date', String(d.getFullYear()));
        break;
    }
    navigate(params);
  }, [navigate, searchParams, period, dateParam]);

  const applyCustom = useCallback(() => {
    const params = new URLSearchParams();
    params.set('period', 'custom');
    params.set('from', customFrom);
    params.set('to', customTo);
    navigate(params);
  }, [navigate, customFrom, customTo]);

  let dateLabel = '';
  if (period === 'day' && dateParam) {
    dateLabel = new Date(dateParam).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } else if (period === 'month' && dateParam) {
    const [y, m] = dateParam.split('-');
    dateLabel = new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  } else if (period === 'year' && dateParam) {
    dateLabel = dateParam;
  } else if (period === 'custom') {
    dateLabel = `${fromParam || customFrom} → ${toParam || customTo}`;
  }

  const showArrows = period !== 'custom';

  return (
    <div className="space-y-3 print-hide">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PERIOD_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all',
              period === value
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {showArrows && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium text-zinc-700 min-w-32 text-center capitalize">{dateLabel}</span>
          <button
            onClick={() => shiftDate(1)}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {period === 'custom' && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500">Du</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500">au</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            />
          </div>
          <button
            onClick={applyCustom}
            className="px-3 py-1.5 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Appliquer
          </button>
        </div>
      )}
    </div>
  );
}
