'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeUser } from '@/lib/actions/users';
import { Trash2, Check, X } from 'lucide-react';

export function RemoveButton({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    try {
      const result = await removeUser(userId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-zinc-500">Retirer {userName} ?</span>
        <button onClick={handleRemove} disabled={loading} className="p-1 text-red-500 hover:text-red-700">
          <Check className="size-3.5" />
        </button>
        <button onClick={() => setConfirming(false)} className="p-1 text-zinc-400 hover:text-zinc-600">
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
      title="Retirer"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
