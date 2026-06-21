'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Plus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CAHIER_NAV = [
  { href: '/mode-simple', label: 'Journal', icon: FileText },
  { href: '/mode-simple?new=1', label: '+', icon: Plus, isPrimary: true },
  { href: '/reports', label: 'Rapports', icon: BarChart3 },
];

export function CahierBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-zinc-200/80 bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {CAHIER_NAV.map(({ href, label, icon: Icon, isPrimary }) => {
          const isActive = isPrimary
            ? false
            : pathname === href || pathname.startsWith(href);

          if (isPrimary) {
            return (
              <button
                key={href}
                type="button"
                onClick={() => router.push('/mode-simple?new=1')}
                className="flex flex-col items-center gap-0.5 px-2 -mt-5"
              >
                <div className="size-14 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/20 transition-transform active:scale-95">
                  <Icon className="size-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold leading-tight text-zinc-900">
                  {label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 transition-all duration-150',
                isActive ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'
              )}
            >
              <div className={cn(
                'size-9 rounded-xl flex items-center justify-center transition-all duration-150',
                isActive ? 'bg-zinc-100' : ''
              )}>
                <Icon className="size-5" />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                isActive ? 'font-semibold' : ''
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
