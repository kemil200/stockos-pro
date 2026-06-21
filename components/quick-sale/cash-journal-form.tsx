'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createCashEntry } from '@/lib/actions/invoices';

export function CashJournalForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const qty = Number(quantity) || 0;
  const achat = Number(purchasePrice) || 0;
  const vente = Number(salePrice) || 0;
  const benefice = qty * (vente - achat);
  const canSubmit = productName.trim().length > 0 && qty > 0 && vente >= 0;

  const reset = () => {
    setProductName('');
    setQuantity('1');
    setPurchasePrice('');
    setSalePrice('');
    const d = new Date();
    setDate(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.set('productName', productName.trim());
      formData.set('quantity', quantity);
      formData.set('purchasePrice', purchasePrice || '0');
      formData.set('salePrice', salePrice);
      formData.set('date', date);

      const result = await createCashEntry(formData);
      if (result.success) {
        toast.success('Écriture enregistrée');
        reset();
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors py-2"
      >
        <div className="size-6 rounded-full bg-zinc-900 flex items-center justify-center">
          <Plus className="size-3.5 text-white" />
        </div>
        Nouvelle écriture
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200/80 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold text-zinc-900">Nouvelle écriture</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 text-zinc-400 hover:text-zinc-600"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-500">Produit</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nom du produit"
            autoFocus
            autoComplete="off"
            className="w-full border-0 border-b-2 border-zinc-200 bg-transparent px-0 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-0 placeholder:text-zinc-300"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-zinc-500">Quantité</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              step="any"
              className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-zinc-500">Acheté à</label>
            <div className="relative">
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                min="0"
                step="any"
                placeholder="0"
                className="w-full border border-zinc-200 rounded-lg pl-2.5 pr-10 py-2 text-sm text-right focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">F</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-zinc-500">Vendu à</label>
            <div className="relative">
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min="0"
                step="any"
                placeholder="0"
                className="w-full border border-zinc-200 rounded-lg pl-2.5 pr-10 py-2 text-sm text-right focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">F</span>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>

        {(vente > 0 || achat > 0) && (
          <div className={cn(
            'rounded-lg px-3 py-2.5 text-sm font-medium',
            benefice >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          )}>
            {benefice >= 0 ? 'Bénéfice' : 'Perte'} : {benefice >= 0 ? '+' : ''}{Math.round(benefice).toLocaleString('fr-FR')} FCFA
            {qty > 1 && (
              <span className="text-xs ml-1 opacity-70">
                ({(benefice / qty).toFixed(0)} F / unité)
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          className="flex-1 h-10 text-sm font-medium"
          disabled={submitting || !canSubmit}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enregistrement
            </>
          ) : (
            <>
              <Save className="size-4" />
              Enregistrer
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setOpen(false)}
          className="h-10 text-sm"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(' ');
}
