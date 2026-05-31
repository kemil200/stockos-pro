'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const FILTERS = [
  { label: 'Toutes', value: '' },
  { label: 'Brouillons', value: 'DRAFT' },
  { label: 'Validées', value: 'VALIDATED' },
  { label: 'Payées', value: 'PAID' },
  { label: 'Annulées', value: 'CANCELLED' },
];

export function InvoiceFilters({ currentStatus, currentQ }: { currentStatus?: string; currentQ?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(currentQ || '');

  const handleSearch = useCallback((value: string) => {
    setQ(value);
    const params = new URLSearchParams();
    if (currentStatus) params.set('status', currentStatus);
    if (value.trim()) params.set('q', value.trim());
    router.push(`/invoices${params.toString() ? `?${params.toString()}` : ''}`);
  }, [currentStatus, router]);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Rechercher facture ou client..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(q); }}
          onBlur={() => handleSearch(q)}
          className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ label, value }) => {
          const params = new URLSearchParams();
          if (value) params.set('status', value);
          if (currentQ) params.set('q', currentQ);
          return (
            <Link
              key={label}
              href={`/invoices${params.toString() ? `?${params.toString()}` : ''}`}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                (currentStatus || '') === value
                  ? 'bg-zinc-900 text-white'
                  : 'hover:bg-zinc-100 text-zinc-600',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
