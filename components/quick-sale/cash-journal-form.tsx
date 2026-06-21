'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createCashEntry } from '@/lib/actions/invoices';

export function CashJournalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpen = searchParams.get('new') === '1';

  const [open, setOpen] = useState(shouldOpen);
  const [submitting, setSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (shouldOpen) {
      setOpen(true);
      router.replace('/mode-simple', { scroll: false });
    }
  }, [shouldOpen, router]);

  const qty = Number(quantity) || 1;
  const achat = Number(purchasePrice) || 0;
  const vente = Number(salePrice) || 0;
  const benefice = qty * (vente - achat);
  const canSubmit = productName.trim().length > 0 && vente > 0;

  const reset = () => {
    setProductName('');
    setQuantity('1');
    setPurchasePrice('');
    setSalePrice('');
    setDate(new Date().toISOString().slice(0, 10));
    setShowOptions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.set('productName', productName.trim());
      fd.set('quantity', quantity || '1');
      fd.set('purchasePrice', purchasePrice || '0');
      fd.set('salePrice', salePrice);
      fd.set('date', date);

      const res = await createCashEntry(fd);
      if (res.success) {
        toast.success('Écriture enregistrée');
        reset();
        router.refresh();
      } else {
        toast.error(res.error || 'Erreur');
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
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200/80 bg-white p-4 space-y-4" id="cash-journal-form">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold text-zinc-900">
          Nouvelle écriture
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-zinc-500">
            Qu&apos;avez-vous vendu ?
          </label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="ex: Sac de riz 25kg"
            autoFocus
            autoComplete="off"
            className="w-full border-0 border-b-2 border-zinc-200 bg-transparent px-0 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-0 placeholder:text-zinc-300"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-500">
              Coût d&apos;achat
            </label>
            <div className="relative mt-0.5">
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                min="0"
                step="any"
                placeholder="0"
                className="w-full border border-zinc-200 rounded-lg pl-2.5 pr-10 py-2.5 text-sm text-right focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                FCFA
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500">
              Prix de vente
            </label>
            <div className="relative mt-0.5">
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min="0"
                step="any"
                placeholder="0"
                className="w-full border border-zinc-200 rounded-lg pl-2.5 pr-10 py-2.5 text-sm text-right focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
                FCFA
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          {showOptions ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          Plus d&apos;options
        </button>

        {showOptions && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-medium text-zinc-500">Quantité</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="any"
                className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-sm text-center focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 mt-0.5"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-2.5 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 mt-0.5"
              />
            </div>
          </div>
        )}

        {(vente > 0 || achat > 0) && (
          <div className={
            benefice >= 0
              ? 'rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700'
              : 'rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700'
          }>
            {benefice >= 0 ? 'Bénéfice' : 'Perte'} : {benefice >= 0 ? '+' : ''}
            {Math.round(benefice).toLocaleString('fr-FR')} FCFA
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
          className="flex-1 h-11 text-sm font-medium"
          disabled={submitting || !canSubmit}
        >
          {submitting ? (
            <><Loader2 className="size-4 animate-spin" /> Enregistrement</>
          ) : (
            <><Save className="size-4" /> Enregistrer</>
          )}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-11 text-sm">
          Annuler
        </Button>
      </div>
    </form>
  );
}
