'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const FILTERS = [
  { label: 'Toutes', value: '' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'Validées', value: 'VALIDATED' },
  { label: 'Payées', value: 'PAID' },
  { label: 'Annulées', value: 'CANCELLED' },
];

export function InvoiceFilters({ currentStatus }: { currentStatus?: string }) {
  return (
    <div className="flex gap-2">
      {FILTERS.map(({ label, value }) => (
        <Link
          key={label}
          href={value ? `/invoices?status=${value}` : '/invoices'}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md transition-colors',
            (currentStatus || '') === value
              ? 'bg-zinc-900 text-white'
              : 'hover:bg-zinc-100 text-zinc-600',
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
