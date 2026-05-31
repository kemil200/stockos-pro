'use client';

import { authClient } from '@/lib/auth-client';
import { Store } from 'lucide-react';
import { useState } from 'react';

export function OnboardingCreateOrg() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await authClient.organization.create({ name: name.trim(), slug });
      window.location.href = '/onboarding';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Store className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Créez votre boutique</h1>
          <p className="text-zinc-500 mt-2">
            Donnez un nom à votre commerce pour commencer
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
          <div>
            <label htmlFor="shop-name" className="block text-sm font-medium mb-1.5">
              Nom de la boutique
            </label>
            <input
              id="shop-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Boutique de Kémil"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Création en cours...' : 'Créer ma boutique'}
          </button>
        </form>
      </div>
    </div>
  );
}
