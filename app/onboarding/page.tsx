'use client';

import { CreateOrganization, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Store } from 'lucide-react';

export default function OnboardingPage() {
  const { orgId, isLoaded } = useAuth();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !orgId) return;

    async function createShop() {
      setCreating(true);
      try {
        const res = await fetch('/api/shop/create', { method: 'POST' });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || 'Erreur lors de la création');
          return;
        }
        router.push('/invoices');
      } catch {
        setError('Erreur réseau');
      }
    }
    createShop();
  }, [isLoaded, orgId, router]);

  if (creating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-6">
            <Store className="size-8 text-white" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Création de votre boutique...</h2>
          <p className="text-sm text-zinc-500">Un instant</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); window.location.reload(); }}
            className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (orgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-400">Redirection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Store className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Créez votre boutique</h1>
          <p className="text-zinc-500 mt-2">
            Donnez un nom à votre commerce pour commencer
          </p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <CreateOrganization afterCreateOrganizationUrl="/onboarding" />
        </div>
      </div>
    </div>
  );
}
