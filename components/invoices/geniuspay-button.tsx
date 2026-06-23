'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Smartphone, Loader2 } from 'lucide-react';
import { initiateGeniusPayPayment } from '@/lib/actions/geniuspay';

export function GeniusPayButton({ invoiceId, balance }: { invoiceId: string; balance: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await initiateGeniusPayPayment(invoiceId);
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.error(res.error || 'Erreur lors du paiement');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (balance <= 0) return null;

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm inline-flex items-center gap-1.5"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Smartphone className="size-3.5" />
      )}
      {loading ? 'Redirection...' : `Payer ${balance.toLocaleString('fr-FR')} F`}
    </button>
  );
}
