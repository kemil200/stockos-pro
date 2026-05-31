'use client';

import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user?.user_metadata ?? null));
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">
          {user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors"
        >
          <LogOut className="size-4" />
          Déconnexion
        </button>
      </div>
    </header>
  );
}
