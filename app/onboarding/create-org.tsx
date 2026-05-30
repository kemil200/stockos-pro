'use client';

import { CreateOrganization } from '@clerk/nextjs';
import { Store } from 'lucide-react';

export function OnboardingCreateOrg() {
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
