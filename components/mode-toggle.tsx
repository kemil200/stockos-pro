'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { setUserMode } from '@/lib/actions/user-preferences';

export function ModeToggle({ currentMode }: { currentMode: 'simple' | 'complete' }) {
  const router = useRouter();

  const switchMode = async (mode: 'simple' | 'complete') => {
    if (mode === currentMode) return;
    await setUserMode(mode);
    router.push(mode === 'simple' ? '/mode-simple' : '/invoices');
  };

  return (
    <div className="flex rounded-full bg-zinc-100 p-0.5">
      <button
        type="button"
        onClick={() => switchMode('simple')}
        className={cn(
          'rounded-full px-3 py-1.5 text-[11px] font-medium transition-all',
          currentMode === 'simple'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        )}
      >
        Cahier
      </button>
      <button
        type="button"
        onClick={() => switchMode('complete')}
        className={cn(
          'rounded-full px-3 py-1.5 text-[11px] font-medium transition-all',
          currentMode === 'complete'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        )}
      >
        Complet
      </button>
    </div>
  );
}
