'use client';

import { useState } from 'react';
import { initiateSubscriptionPayment } from '@/lib/actions/geniuspay';
import { Loader2, CreditCard, CheckCircle2, XCircle, RotateCw } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  ESSENTIAL: 'Essential',
  BUSINESS: 'Business',
};

const PLAN_PRICES: Record<string, { monthly: string; annual: string }> = {
  STARTER: { monthly: '5 000 FCFA/mois', annual: '55 000 FCFA/an' },
  ESSENTIAL: { monthly: '8 500 FCFA/mois', annual: '90 000 FCFA/an' },
  BUSINESS: { monthly: '13 000 FCFA/mois', annual: '120 000 FCFA/an' },
};

export function SubscriptionBanner({
  plan,
  trialEndsAt,
  periodEnd,
  status,
}: {
  plan: string;
  trialEndsAt: string | null;
  periodEnd: string | null;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual');
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  const isActive = status === 'ACTIVE';
  const isExpired = status === 'EXPIRED';
  const isTrial = status === 'TRIAL';

  if (!isTrial && !isExpired && !isActive) return null;

  const now = new Date();
  const endDate = isTrial && trialEndsAt
    ? new Date(trialEndsAt)
    : isActive && periodEnd
      ? new Date(periodEnd)
      : null;

  const daysLeft = endDate
    ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isExpiring = !isExpired && daysLeft <= 14;
  const isExpiredOrNear = isExpired || isExpiring;

  if (!isExpiredOrNear && isActive) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await initiateSubscriptionPayment(plan, billing);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setError(res.error || 'Erreur lors du paiement');
        setLoading(false);
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2.5 lg:px-6">
        <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="size-4" />
          Paiement initié. Votre abonnement sera activé automatiquement.
        </div>
      </div>
    );
  }

  const planLabel = PLAN_LABELS[plan] || plan;
  const prices = PLAN_PRICES[plan] || PLAN_PRICES.ESSENTIAL;

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 lg:px-6">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {isExpired ? (
          <span className="text-sm text-amber-800">
            {isTrial
              ? `Votre essai a expiré. Passez à ${planLabel} pour continuer.`
              : `Votre abonnement a expiré. Renouvelez ${planLabel} pour continuer.`}
          </span>
        ) : isActive && isExpiring ? (
          <span className="text-sm text-amber-800">
            Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}. Renouvelez maintenant.
          </span>
        ) : (
          <span className="text-sm text-amber-800">
            Votre essai expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}. Passez à {planLabel}.
          </span>
        )}

        <div className="flex items-center gap-1.5 bg-white/60 rounded-lg p-0.5 border border-amber-200">
          <button
            onClick={() => setBilling('annual')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              billing === 'annual' ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            Annuel
          </button>
          <button
            onClick={() => setBilling('monthly')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              billing === 'monthly' ? 'bg-amber-200 text-amber-900' : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            Mensuel
          </button>
        </div>

        <button
          onClick={handlePay}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isActive ? (
            <RotateCw className="size-3.5" />
          ) : (
            <CreditCard className="size-3.5" />
          )}
          {loading
            ? 'Redirection...'
            : `${isActive || isExpired ? 'Renouveler' : 'Payer'} — ${billing === 'annual' ? prices.annual : prices.monthly}`}
        </button>

        {error && (
          <span className="text-sm text-red-600 flex items-center gap-1">
            <XCircle className="size-3.5" />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
