'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Package,
  Wallet,
  ShoppingCart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef, useCallback } from 'react';

function useAvatarGroup() {
  const groupRef = useRef<HTMLElement>(null);

  const onEnter = useCallback((e: React.MouseEvent) => {
    const items = Array.from(groupRef.current?.querySelectorAll('.t-avatar') ?? []);
    const idx = items.indexOf(e.currentTarget as Element);
    const cs = getComputedStyle(document.documentElement);
    const lift = parseFloat(cs.getPropertyValue('--avatar-lift')) || -4;
    const falloff = parseFloat(cs.getPropertyValue('--avatar-falloff')) || 0.45;
    const scale = cs.getPropertyValue('--avatar-scale').trim() || '1.05';
    const easeIn = cs.getPropertyValue('--avatar-ease-in').trim() || 'cubic-bezier(0.22,1,0.36,1)';

    items.forEach((el, i) => {
      const dist = Math.abs(i - idx);
      const shift = (lift * Math.pow(falloff, dist)).toFixed(3);
      (el as HTMLElement).style.setProperty('--shift', shift + 'px');
      (el as HTMLElement).style.setProperty('--scale-active', i === idx ? scale : '1');
      (el as HTMLElement).style.transitionTimingFunction = easeIn;
    });
  }, []);

  const onLeave = useCallback(() => {
    const items = Array.from(groupRef.current?.querySelectorAll('.t-avatar') ?? []);
    const cs = getComputedStyle(document.documentElement);
    const easeOut = cs.getPropertyValue('--avatar-ease-out').trim() || 'cubic-bezier(0.34,3.85,0.64,1)';
    items.forEach((el) => {
      (el as HTMLElement).style.setProperty('--shift', '0px');
      (el as HTMLElement).style.setProperty('--scale-active', '1');
      (el as HTMLElement).style.transitionTimingFunction = easeOut;
    });
  }, []);

  return { groupRef, onEnter, onLeave };
}

const NAV_ITEMS = [
  { href: '/invoices', label: 'Factures', icon: FileText },
  { href: '/supply', label: 'Achats', icon: ShoppingCart },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/cash-register', label: 'Vente', icon: Wallet },
];

export function BottomNav({ plan, role }: { plan?: string | null; role?: string }) {
  const pathname = usePathname();
  const { groupRef, onEnter, onLeave } = useAvatarGroup();

  const isEmployee = role === 'EMPLOYEE';

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (isEmployee && item.href === '/supply') return false;
    if (isEmployee && item.href === '/products') return false;
    return true;
  });

  return (
    <nav ref={groupRef} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-zinc-200/80 bg-white/90 backdrop-blur-xl safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 pb-safe">
        {visibleItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={onEnter}
              onMouseLeave={onLeave}
              className={cn(
                't-avatar flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl min-w-0 transition-all duration-150',
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
