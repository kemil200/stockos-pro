'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignRoleToUser } from '@/lib/actions/roles';
import { Settings2 } from 'lucide-react';

interface Props {
  userId: string;
  currentRoleId: string | null;
  roles: { id: string; name: string }[];
  userName: string;
}

export function AssignRoleButton({ userId, currentRoleId, roles, userName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAssign = async (roleId: string | null) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('userId', userId);
      if (roleId) fd.append('roleId', roleId);

      const result = await assignRoleToUser(fd);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
        title="Changer le rôle"
      >
        <Settings2 className="size-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl border shadow-lg py-1">
            <p className="px-3 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">{userName}</p>
            <button
              onClick={() => handleAssign(null)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors ${!currentRoleId ? 'text-emerald-600 font-medium' : 'text-zinc-700'}`}
              disabled={saving}
            >
              Aucun rôle
            </button>
            <div className="border-t my-1" />
            {roles.map((r) => (
              <button
                key={r.id}
                onClick={() => handleAssign(r.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 transition-colors ${currentRoleId === r.id ? 'text-emerald-600 font-medium' : 'text-zinc-700'}`}
                disabled={saving}
              >
                {r.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
