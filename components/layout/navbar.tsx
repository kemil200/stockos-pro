'use client';

import { authClient } from '@/lib/auth-client';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<{ user: { name?: string; email?: string } } | null>(null);

  useEffect(() => {
    authClient.getSession().then((res) => setSession(res.data));
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/');
  };

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6">
      <div className="flex items-center gap-4" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-500">
          {session?.user?.email}
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
