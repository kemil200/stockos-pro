'use client';

import { LogOut, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { MobileSidebar } from './sidebar';
import { CommandPalette } from '@/components/command-palette';

export function Navbar({ plan }: { plan?: string | null }) {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      setUser({
        name: meta.name,
        email: data.user?.email,
        role: data.user?.app_metadata?.role,
      });
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <header className="h-14 lg:h-16 border-b border-zinc-200/50 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <MobileSidebar plan={plan} />
        {user?.role === 'SUPERADMIN' && (
          <Link
            href="/superadmin"
            className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 text-white text-[11px] font-semibold"
          >
            <Shield className="size-3" />
            Superadmin
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        <CommandPalette />
        <span className="text-sm text-zinc-500 hidden sm:inline truncate max-w-[180px]">
          {user?.email}
        </span>
        <div className="size-8 rounded-full bg-zinc-800 flex items-center justify-center text-white text-xs font-semibold shadow-sm shrink-0">
          {initials}
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Déconnexion" className="text-zinc-400 hover:text-zinc-900">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
