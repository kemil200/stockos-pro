'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { inviteUserByEmail } from '@/lib/actions/users';
import { UserPlus } from 'lucide-react';

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await inviteUserByEmail(email.trim());
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Utilisateur ajouté' });
        setEmail('');
        router.refresh();
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5">
      <h2 className="font-heading font-semibold text-base flex items-center gap-2 mb-3">
        <UserPlus className="size-4 text-zinc-600" />
        Inviter un utilisateur
      </h2>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-zinc-500">Email du compte existant</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="employe@email.com"
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
        >
          {loading ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>
      {message && (
        <p className={`text-xs mt-2 ${message.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
