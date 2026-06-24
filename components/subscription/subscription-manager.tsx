'use client';

import { useState } from 'react';
import { initiateSubscriptionPayment } from '@/lib/actions/geniuspay';
import { Loader2, RotateCw, Check, ArrowUpRight } from 'lucide-react';

const PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER: { monthly: 5000, annual: 55000 },
  ESSENTIAL: { monthly: 8500, annual: 90000 },
  BUSINESS: { monthly: 13000, annual: 120000 },
};

const LABELS: Record<string, string> = {
  STARTER: 'Starter',
  ESSENTIAL: 'Essential',
  BUSINESS: 'Business',
};

const PLAN_ORDER = ['STARTER', 'ESSENTIAL', 'BUSINESS'];

export function SubscriptionManager({ currentPlan, status }: { currentPlan: string; status: string }) {
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handlePay = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      const res = await initiateSubscriptionPayment(plan, billing);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch {
      setLoadingPlan(null);
    }
  };

  const formatPrice = (n: number) => `${n.toLocaleString('fr-FR')} FCFA`;

  return (
    <div className="space-y-4">
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
      </div>

      <div className="grid gap-3">
        {PLAN_ORDER.map((plan) => {
          const prices = PRICES[plan];
          const isCurrent = plan === currentPlan;
          const loading = loadingPlan === plan;
          const price = billing === 'annual' ? prices.annual : prices.monthly;
          const perLabel = billing === 'annual' ? '/an' : '/mois';

          return (
            <div
              key={plan}
              className={`rounded-xl border p-4 transition-all ${
                isCurrent
                  ? 'border-zinc-900 bg-zinc-50/50 ring-1 ring-zinc-900/10'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg flex items-center justify-center ${
                    isCurrent ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {isCurrent ? <Check className="size-4" /> : <span className="text-xs font-bold">{PLAN_ORDER.indexOf(plan) + 1}</span>}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{LABELS[plan]}</h3>
                    <p className="text-xs text-zinc-500">
                      {isCurrent && status === 'TRIAL'
                        ? 'Essai en cours'
                        : isCurrent && status === 'ACTIVE'
                          ? 'Votre formule actuelle'
                          : ''}
                      {!isCurrent && plan === 'BUSINESS'
                        ? 'Utilisateurs illimités, API'
                        : !isCurrent && plan === 'ESSENTIAL'
                          ? 'Packs, rapports avancés'
                          : !isCurrent && plan === 'STARTER'
                            ? 'Essentiel pour démarrer'
                            : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatPrice(price)}</p>
                    <p className="text-[10px] text-zinc-400">{perLabel}</p>
                  </div>
                  {!isCurrent ? (
                    <button
                      onClick={() => handlePay(plan)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <ArrowUpRight className="size-3" />
                      )}
                      {loading ? '...' : 'Choisir'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePay(plan)}
                      disabled={loading}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <RotateCw className="size-3" />
                      )}
                      {loading ? '...' : 'Renouveler'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
