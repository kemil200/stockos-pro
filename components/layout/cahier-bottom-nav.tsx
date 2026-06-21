'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Plus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAHIER_NAV = [
  { href: '/mode-simple', label: 'Journal', icon: FileText },
  { href: '/mode-simple?new=1', label: 'Nouveau', icon: Plus, isPrimary: true },
  { href: '/mode-simple/historique', label: 'Historique', icon: Calendar },
];

export function CahierBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-zinc-200/80 bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {CAHIER_NAV.map(({ href, label, icon: Icon, isPrimary }) => {
          const isActive = isPrimary
            ? pathname === '/mode-simple' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('new')
            : pathname === href || pathname.startsWith(href + '/');

          return isPrimary ? (
            <button
              key={href}
              type="button"
              onClick={() => router.push('/mode-simple?new=1')}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 transition-all duration-150 text-zinc-900"
            >
              <div className="size-9 rounded-xl flex items-center justify-center transition-all duration-150 bg-zinc-900 shadow-sm">
                <Icon className="size-5 text-white" />
              </div>
              <span className="text-[10px] font-semibold leading-tight">{label}</span>
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 transition-all duration-150',
                isActive
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <div
                className={cn(
                  'size-9 rounded-xl flex items-center justify-center transition-all duration-150',
                  isActive ? 'bg-zinc-900 shadow-sm' : ''
                )}
              >
                <Icon className={cn('size-5', isActive ? 'text-white' : '')} />
              </div>
              <span className={cn('text-[10px] font-medium leading-tight', isActive ? 'font-semibold' : '')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
