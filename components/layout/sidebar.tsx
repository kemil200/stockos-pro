'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Package,
  Warehouse,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  Users,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { href: '/invoices', label: 'Factures', icon: FileText },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/supply', label: 'Approvisionnement', icon: ShoppingCart },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/stock', label: 'Stock', icon: Warehouse },
  { href: '/payments', label: 'Paiements', icon: Receipt },
  { href: '/cash-register', label: 'Caisse', icon: Wallet },
  { href: '/reports', label: 'Rapports', icon: BarChart3 },
  { href: '/settings', label: 'Paramètres', icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="px-5 h-14 flex items-center border-b shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={onNavigate}
        >
          <Logo size={32} variant="icon" />
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-tight">StockOS Pro</h1>
            <p className="text-[10px] text-zinc-400 leading-tight">Gestion commerciale</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
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

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('w-60 border-r bg-white h-screen flex flex-col shrink-0 max-lg:hidden', className)}>
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0" showCloseButton={false}>
        <SidebarContent onNavigate={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        }} />
      </SheetContent>
    </Sheet>
  );
}
