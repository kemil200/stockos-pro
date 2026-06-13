'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordPayment } from '@/lib/actions/payments';
import { formatCurrency } from '@/lib/utils/currency';

interface Props {
  invoiceId: string;
  balance: string;
}

export function PaymentForm({ invoiceId, balance }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [amount, setAmount] = useState(Number(balance));
  const [method, setMethod] = useState('CASH');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const formData = new FormData();
    formData.append('invoiceId', invoiceId);
    formData.append('amount', String(amount));
    formData.append('method', method);
    const result = await recordPayment(formData);
    if (result.success) {
      router.refresh();
    } else {
      setSubmitError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
      <h3 className="font-semibold">Encaisser un paiement</h3>
      <p className="text-sm text-zinc-500">
        Solde restant : {formatCurrency(Number(balance))}
      </p>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Montant</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          max={Number(balance)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Mode de paiement</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
        >
          <option value="CASH">Espèces</option>
          <option value="MOBILE_MONEY">Mobile Money</option>
          <option value="BANK_TRANSFER">Virement bancaire</option>
          <option value="CARD">Carte</option>
          <option value="CHECK">Chèque</option>
        </select>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || amount <= 0 || amount > Number(balance)}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {submitting ? 'Traitement...' : `Encaisser ${formatCurrency(amount)}`}
      </button>
    </form>
  );
}
