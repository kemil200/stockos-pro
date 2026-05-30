'use client';

import { CreateOrganization, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingPage() {
  const { orgId, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && orgId) {
      router.push('/invoices');
    }
  }, [isLoaded, orgId, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-400">Chargement...</div>
      </div>
    );
  }

  if (orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-400">Redirection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Créez votre boutique</h1>
          <p className="text-zinc-500 mt-2">
            Donnez un nom à votre commerce pour commencer
          </p>
        </div>
        <CreateOrganization afterCreateOrganizationUrl="/invoices" />
      </div>
    </div>
  );
}
