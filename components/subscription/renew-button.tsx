'use client';

import { useState } from 'react';
import { initiateSubscriptionPayment } from '@/lib/actions/geniuspay';
import { Loader2, RotateCw } from 'lucide-react';

const PLAN_PRICES: Record<string, { monthly: string; annual: string }> = {
  STARTER: { monthly: '5 000 FCFA', annual: '55 000 FCFA' },
  ESSENTIAL: { monthly: '8 500 FCFA', annual: '90 000 FCFA' },
  BUSINESS: { monthly: '13 000 FCFA', annual: '120 000 FCFA' },
};

export function RenewSubscriptionButton({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');

  const prices = PLAN_PRICES[plan] || PLAN_PRICES.ESSENTIAL;

  const handleRenew = async () => {
    setLoading(true);
    try {
      const res = await initiateSubscriptionPayment(plan, billing);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5">
        <button
          onClick={() => setBilling('annual')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            billing === 'annual' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Annuel
        </button>
        <button
          onClick={() => setBilling('monthly')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            billing === 'monthly' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Mensuel
        </button>
      </div>
      <button
        onClick={handleRenew}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <RotateCw className="size-3.5" />
        )}
        {loading ? 'Redirection...' : `Renouveler — ${billing === 'annual' ? prices.annual : prices.monthly}`}
      </button>
    </div>
  );
}
