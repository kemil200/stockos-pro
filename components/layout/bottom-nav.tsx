'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Package,
  Receipt,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/invoices', label: 'Factures', icon: FileText },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/cash-register', label: 'Caisse', icon: Wallet },
  { href: '/payments', label: 'Paiements', icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-zinc-200/80 bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 transition-all duration-150',
                isActive
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600',
              )}
            >
              <div className={cn(
                'size-9 rounded-xl flex items-center justify-center transition-all duration-150',
                isActive ? 'bg-zinc-900 shadow-sm' : '',
              )}>
                <Icon className={cn('size-5', isActive ? 'text-white' : '')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium leading-tight',
                isActive ? 'font-semibold' : '',
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
