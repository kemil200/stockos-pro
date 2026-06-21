'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Store, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAHIER_ITEMS = [
  { href: '/mode-simple', label: 'Journal', icon: FileText },
  { href: '/mode-simple/historique', label: 'Historique', icon: Calendar },
];

export function CahierSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-44 shrink-0 border-r border-zinc-200/50 bg-white flex flex-col">
      <div className="px-4 h-14 flex items-center border-b shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Store className="size-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">StockOS</span>
        </Link>
      </div>

      <nav className="flex-1 px-2.5 py-3 space-y-0.5">
        {CAHIER_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white font-medium shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t">
        <p className="text-[10px] text-zinc-400">Mode Cahier</p>
      </div>
    </aside>
  );
}
