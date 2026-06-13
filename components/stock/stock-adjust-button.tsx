'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adjustStock, getStockHistory } from '@/lib/actions/products';

interface StockMovementRow {
  id: string;
  movement_type: string;
  quantity: string;
  reason: string | null;
  created_at: string;
}

interface Props {
  productId: string;
  productName: string;
  currentQty: number;
}

export function StockAdjustButton({ productId, productName, currentQty }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(currentQty);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<StockMovementRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (open && productId) {
      setLoadingHistory(true);
      getStockHistory(productId)
        .then(setHistory)
        .finally(() => setLoadingHistory(false));
    }
  }, [open, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('newQuantity', String(qty));
      formData.append('reason', 'Ajustement manuel');
      const result = await adjustStock(formData);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const typeLabel = (t: string) => {
    const labels: Record<string, string> = { IN: 'Entrée', OUT: 'Sortie', SALE: 'Vente', ADJUSTMENT: 'Ajustement' };
    return labels[t] || t;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setQty(currentQty); setOpen(true); }}
        className="text-xs px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 transition-colors"
      >
        Ajuster
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-base mb-1">{productName}</h3>
            <p className="text-sm text-zinc-500 mb-4">Stock actuel : <span className="font-medium">{currentQty}</span></p>

            <form onSubmit={handleSubmit} className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nouvelle quantité</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-zinc-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting ? 'Mise à jour...' : 'Enregistrer'}
                </button>
              </div>
            </form>

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-zinc-700 mb-2">Derniers mouvements</h4>
              {loadingHistory ? (
                <p className="text-xs text-zinc-400">Chargement...</p>
              ) : history.length === 0 ? (
                <p className="text-xs text-zinc-400">Aucun mouvement</p>
              ) : (
                <div className="space-y-2">
                  {history.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500">{new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
                      <span className="font-medium">{typeLabel(m.movement_type)}</span>
                      <span className="tabular-nums">{m.quantity}</span>
                      <span className="text-zinc-400 truncate max-w-[80px]">{m.reason || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
