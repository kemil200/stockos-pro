'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { purchaseStock } from '@/lib/actions/supply';
import { formatCurrency } from '@/lib/utils/currency';
import { Check } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit_price: string;
  purchase_price: string | null;
}

export function SupplyForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [qty, setQty] = useState<number | string>(1);
  const [price, setPrice] = useState('');

  const selected = products.find((p) => p.id === selectedId);
  const total = Number(qty) * (Number(price) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const fd = new FormData();
    fd.append('productId', selectedId);
    fd.append('quantity', String(qty));
    fd.append('unitPrice', String(price || '0'));
    fd.append('reason', `Achat ${selected?.name ?? ''} (${qty}u)`);

    const result = await purchaseStock(fd);
    if (result.success) {
      setSuccess(true);
      setSelectedId('');
      setQty(1);
      setPrice('');
      router.refresh();
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-zinc-700 mb-1 block">Produit</label>
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            const p = products.find((x) => x.id === e.target.value);
            if (p && p.purchase_price) setPrice(String(Number(p.purchase_price)));
            setError(null);
          }}
          className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          required
        >
          <option value="">Sélectionner un produit</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — vente {formatCurrency(Number(p.unit_price))}
              {p.purchase_price ? ` / achat ${formatCurrency(Number(p.purchase_price))}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Quantité reçue</label>
          <input
             type="number"
            step="0.001"
            min="0.001"
            value={qty}
            onChange={(e) => {
              const v = e.target.value;
              setQty(v === '' ? '' : Math.max(0.001, Number(v)));
            }}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 mb-1 block">Prix d&apos;achat unitaire</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="FCFA"
            required
          />
        </div>
      </div>

      {selectedId && total > 0 && (
        <p className="text-sm text-zinc-500">
          Total achat : <span className="font-semibold text-zinc-900 tabular-nums">{formatCurrency(total)}</span>
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
          <Check className="size-4" /> Achat enregistré
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedId}
        className="w-full py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-sm"
      >
        {submitting ? 'Enregistrement...' : `Enregistrer l'achat${total > 0 ? ` — ${formatCurrency(total)}` : ''}`}
      </button>
    </form>
  );
}
