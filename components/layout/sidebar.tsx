'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Package,
  Warehouse,
  Receipt,
  BarChart3,
  Settings,
  Menu,
  Store,
  Users,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/invoices', label: 'Factures', icon: FileText, feature: null as string | null },
  { href: '/clients', label: 'Clients', icon: Users, feature: null },
  { href: '/supply', label: 'Approvisionnement', icon: ShoppingCart, feature: null },
  { href: '/products', label: 'Produits', icon: Package, feature: null },
  { href: '/stock', label: 'Stock', icon: Warehouse, feature: null },
  { href: '/payments', label: 'Paiements', icon: Receipt, feature: null },
  { href: '/mode-simple', label: 'Vente rapide', icon: Zap, feature: null },
  { href: '/reports', label: 'Rapports', icon: BarChart3, feature: 'reports' as const },
  { href: '/settings', label: 'Paramètres', icon: Settings, feature: null },
];

function SidebarContent({ onNavigate, plan, role }: { onNavigate?: () => void; plan?: string | null; role?: string }) {
  const pathname = usePathname();

  const isEmployee = role === 'EMPLOYEE';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.feature) return true;
    return true;
  }).filter((item) => {
    if (!isEmployee) return true;
    return ['/invoices', '/clients', '/mode-simple'].includes(item.href);
  });

  return (
    <>
      <div className="px-5 h-14 flex items-center border-b shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <div className="size-8 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Store className="size-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-tight">StockOS Pro</h1>
            <p className="text-[10px] text-zinc-400 leading-tight">Gestion commerciale</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                isActive
                  ? 'bg-zinc-900 text-white font-medium shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100',
              )}
            >
              <Icon className={cn('size-4.5 shrink-0', isActive ? 'text-white' : 'text-zinc-400')} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-3 border-t shrink-0">
        <p className="text-[10px] text-zinc-400 text-center">StockOS Pro v1.0</p>
      </div>
    </>
  );
}

export function Sidebar({ className, plan, role }: { className?: string; plan?: string | null; role?: string }) {
  return (
    <aside className={cn('w-60 border-r bg-white h-screen flex flex-col shrink-0 max-lg:hidden', className)}>
      <SidebarContent plan={plan} role={role} />
    </aside>
  );
}

export function MobileSidebar({ plan, role }: { plan?: string | null; role?: string }) {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
        <SidebarContent plan={plan} role={role} onNavigate={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }} />
      </SheetContent>
    </Sheet>
  );
}
