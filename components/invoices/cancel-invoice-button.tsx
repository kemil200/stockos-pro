'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CancelInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!reason.trim()) {
      setError('Un motif est requis');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('invoiceId', invoiceId);
      formData.append('reason', reason.trim());
      const mod = await import('@/lib/actions/invoices');
      const result = await mod.cancelInvoice(invoiceId, reason.trim());
      if (!result.success) {
        setError(result.error);
      } else {
        router.refresh();
      }
    } catch {
      setError('Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 border border-zinc-200 text-zinc-600 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-all"
      >
        Annuler
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motif d'annulation..."
        className="px-3 py-2 border rounded-lg text-sm w-48"
        autoFocus
        onKeyDown={(e) => e.key === 'Enter' && handleCancel()}
      />
      <button
        type="button"
        onClick={handleCancel}
        disabled={submitting || !reason.trim()}
        className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50"
      >
        {submitting ? '...' : 'Confirmer'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setReason(''); setError(null); }}
        className="text-xs text-zinc-400 hover:text-zinc-600"
      >
        ✕
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
