'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Package,
  Warehouse,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/invoices', label: 'Factures', icon: FileText },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/stock', label: 'Stock', icon: Warehouse },
  { href: '/payments', label: 'Paiements', icon: Receipt },
  { href: '/cash-register', label: 'Caisse', icon: Wallet },
  { href: '/reports', label: 'Rapports', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-white h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">StockOS Pro</h1>
            <p className="text-[11px] text-zinc-400 leading-tight">Gestion commerciale</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/'
            ? pathname === '/'
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                isActive
                  ? 'bg-zinc-900 text-white font-medium shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
              )}
            >
              <Icon className={cn('size-4', isActive ? 'text-white' : 'text-zinc-400')} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t mt-auto">
        <p className="text-[11px] text-zinc-400 text-center">StockOS Pro v1.0</p>
      </div>
    </aside>
  );
}
