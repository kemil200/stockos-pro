'use client';

import { useState } from 'react';
import { initiateSubscriptionPayment } from '@/lib/actions/geniuspay';
import { Loader2, CreditCard, CheckCircle2, XCircle } from 'lucide-react';

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  ESSENTIAL: 'Essential',
  BUSINESS: 'Business',
};

const PLAN_PRICES: Record<string, string> = {
  STARTER: '55 000 FCFA/an',
  ESSENTIAL: '90 000 FCFA/an',
  BUSINESS: '120 000 FCFA/an',
};

export function TrialBanner({
  plan,
  trialEndsAt,
  status,
}: {
  plan: string;
  trialEndsAt: string | null;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  if (status === 'ACTIVE') return null;

  const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
  const now = new Date();
  const daysLeft = trialEnd
    ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const expired = status === 'EXPIRED' || daysLeft <= 0;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await initiateSubscriptionPayment(plan);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        setError(res.error || 'Erreur lors du paiement');
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
    } finally {
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

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 lg:px-6">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {expired ? (
          <span className="text-sm text-amber-800">
            Votre essai a expiré. Passez à {PLAN_LABELS[plan] || plan} pour continuer.
          </span>
        ) : (
          <span className="text-sm text-amber-800">
            Votre essai expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}. Passez à {PLAN_LABELS[plan] || plan} ({PLAN_PRICES[plan] || ''}).
          </span>
        )}
        <button
          onClick={handlePay}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CreditCard className="size-3.5" />
          )}
          {loading ? 'Redirection...' : expired ? 'Réactiver maintenant' : 'Payer maintenant'}
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
