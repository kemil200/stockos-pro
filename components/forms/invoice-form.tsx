'use client';

import { useState, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Layers } from 'lucide-react';
import { createInvoice, updateInvoice } from '@/lib/actions/invoices';
import { getStockLevel } from '@/lib/actions/products';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { formatCurrency } from '@/lib/utils/currency';

interface Product {
  id: string;
  name: string;
  unit_price: string;
}

interface Pack {
  id: string;
  name: string;
  sale_price: string;
}

interface FormLine {
  productId?: string;
  packId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate?: number;
}

interface InvoiceFormData {
  clientName: string;
  clientPhone: string;
  lines: FormLine[];
  shippingFee?: number;
}

interface Props {
  products: Product[];
  packs?: Pack[];
  settings: any;
  invoice?: {
    id: string;
    clientName: string;
    clientPhone?: string;
    lines: FormLine[];
    globalDiscount?: number;
    shippingFee?: number;
  };
}

export function InvoiceForm({ products, packs = [], settings, invoice }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscount, setShowDiscount] = useState(invoice ? (invoice.lines.some(l => (l.discountRate ?? 0) > 0)) : false);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  const editMode = !!invoice;

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      clientName: invoice?.clientName || '',
      clientPhone: invoice?.clientPhone || '',
      lines: invoice?.lines.length ? invoice.lines.map(l => ({
        ...l,
        discountRate: l.discountRate ? l.discountRate * 100 : undefined,
      })) : [{ description: '', quantity: 1, unitPrice: 0 }],
      shippingFee: invoice?.shippingFee || 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = watch('lines');
  const shippingFee = watch('shippingFee');

  const remiseLabel = settings?.commercial_discount_name || settings?.enable_commercial_discount ? settings?.commercial_discount_name : 'Remise';
  const [commercialRate, setCommercialRate] = useState(invoice?.globalDiscount ? invoice.globalDiscount / (invoice.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)) * 100 || 0 : 0);

  const onSubmit = useCallback(async (data: InvoiceFormData) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const linesWithDecimalDiscount = data.lines.map((l) => ({
        ...l,
        discountRate: l.discountRate ? l.discountRate / 100 : 0,
      }));

      const fd = new FormData();
      fd.append('clientName', data.clientName);
      if (data.clientPhone) fd.append('clientPhone', data.clientPhone);
      fd.append('lines', JSON.stringify(linesWithDecimalDiscount));
      const commercialDecimal = commercialRate > 0 ? commercialRate / 100 : 0;
      if (commercialDecimal > 0) fd.append('globalDiscountRate', String(commercialDecimal));
      if (data.shippingFee && data.shippingFee > 0) fd.append('shippingFee', String(data.shippingFee));

      const result = editMode
        ? await updateInvoice(invoice!.id, fd)
        : await createInvoice(fd);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      if (editMode) {
        router.replace(`/invoices/${invoice!.id}`);
      } else {
        router.replace(`/invoices/${(result as any).invoice.id}`);
      }
      router.refresh();
    } catch {
      setSubmitError('Erreur réseau, veuillez réessayer');
    } finally {
      setSubmitting(false);
    }
  }, [router, commercialRate, editMode, invoice]);

  const handleFormError = () => {
    const el = formRef.current?.querySelector('[aria-invalid="true"], .t-input');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('.t-input') || el.closest('.t-input') || el;
      input.classList.remove('is-shaking');
      void (input as HTMLElement).offsetWidth;
      input.classList.add('is-shaking');
      setTimeout(() => input.classList.remove('is-shaking'), 300);
    }
  };

  const selectProduct = useCallback(async (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`lines.${index}.description`, product.name);
      setValue(`lines.${index}.unitPrice`, Number(product.unit_price));
      setValue(`lines.${index}.productId`, productId);
      setValue(`lines.${index}.packId`, undefined);
      try {
        const stock = await getStockLevel(productId);
        setStockLevels((prev) => ({ ...prev, [productId]: stock }));
      } catch { /* non-bloquant */ }
    }
  }, [products, setValue]);

  const selectPack = useCallback((index: number, packId: string) => {
    const pack = packs.find((p) => p.id === packId);
    if (pack) {
      setValue(`lines.${index}.description`, pack.name);
      setValue(`lines.${index}.unitPrice`, Number(pack.sale_price));
      setValue(`lines.${index}.packId`, packId);
      setValue(`lines.${index}.productId`, undefined);
    }
  }, [packs, setValue]);

  const totalItems = watchedLines.reduce((s, l) => s + (l.quantity || 0), 0);
  const previewCalc = watchedLines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);

  return (
    <>
      <form ref={formRef} id="invoice-form" onSubmit={handleSubmit(onSubmit, handleFormError)} className="pb-40 md:pb-8">
        {/* Client — minimal, sans titre */}
        <div className={`bg-white rounded-2xl border p-5 sm:p-6 mb-4 ${errors.clientName ? 'border-red-300' : 'border-zinc-200/80'}`}>
          <div className="t-input-wrap">
            <div className={`t-input ${errors.clientName ? 'is-error' : ''}`}>
              <input
                {...register('clientName', { required: true })}
                className="w-full text-lg font-semibold py-3 border-b-2 border-zinc-200 focus:border-zinc-900 outline-none transition-colors placeholder:text-zinc-300 placeholder:font-normal"
                placeholder="Nom du client"
                autoFocus
              />
            </div>
            {errors.clientName && <p className="t-error-msg text-red-500 text-xs mt-1.5 ml-1">Nom requis</p>}
          </div>
          <input
            {...register('clientPhone')}
            className="w-full text-sm py-2.5 border-b border-zinc-100 focus:border-zinc-400 outline-none transition-colors placeholder:text-zinc-300 mt-2"
            placeholder="+228 90 00 00 00"
          />
        </div>

        {/* Lignes articles */}
        {fields.map((field, index) => {
          const selectedId = watchedLines[index]?.productId;
          const selectedPackId = watchedLines[index]?.packId;
          const stock = selectedId ? stockLevels[selectedId] : undefined;
          const qty = watchedLines[index]?.quantity || 0;
          const overstock = stock !== undefined && qty > stock;
          const isPackLine = !!selectedPackId;

          return (
            <div key={field.id} className={`bg-white rounded-2xl border p-4 sm:p-5 mb-3 ${isPackLine ? 'border-amber-200/80 bg-amber-50/30' : 'border-zinc-200/80'}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-zinc-400 w-5">{index + 1}</span>
                <select
                  className="flex-1 text-sm py-2.5 border-b border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-transparent"
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('pack:')) {
                      selectPack(index, val.slice(5));
                    } else if (val) {
                      selectProduct(index, val);
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Produit ou pack</option>
                  <optgroup label="Produits">
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  {packs.length > 0 && (
                    <optgroup label="Packs">
                      {packs.map((p) => (
                        <option key={`pack:${p.id}`} value={`pack:${p.id}`}>{p.name} (Pack)</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="p-2 text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <input
                {...register(`lines.${index}.description`, { required: true })}
                className="w-full text-sm py-2.5 border-b border-zinc-100 focus:border-zinc-400 outline-none transition-colors placeholder:text-zinc-300"
                placeholder="Description"
              />

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    {...register(`lines.${index}.quantity`, { valueAsNumber: true, required: true, min: 0.001 })}
                    className="w-16 text-center text-sm py-2.5 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                  <span className="text-xs text-zinc-400">×</span>
                  <input
                    type="number"
                    step="any"
                    {...register(`lines.${index}.unitPrice`, { valueAsNumber: true, required: true })}
                    className="w-24 text-center text-sm py-2.5 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                    placeholder="Prix"
                  />
                  <span className="text-xs text-zinc-400">FCFA</span>
                </div>

                {showDiscount && (
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-zinc-400">−</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.discountRate`, { valueAsNumber: true })}
                      className="w-14 text-center text-sm py-2.5 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                      placeholder="%"
                    />
                    <span className="text-xs text-zinc-400">%</span>
                  </div>
                )}
              </div>

              {isPackLine && (
                <p className="text-[11px] mt-2 text-amber-600 font-medium flex items-center gap-1">
                  <Layers className="size-3" /> Pack — le stock de chaque produit sera déduit individuellement
                </p>
              )}
              {stock !== undefined && (
                <p className={`text-[11px] mt-2 ${overstock ? 'text-orange-500 font-medium' : 'text-zinc-400'}`}>
                  Stock: {stock} {overstock ? '⚠️ insuffisant' : ''}
                </p>
              )}
              {errors.lines?.[index]?.quantity && (
                <p className="text-red-500 text-[11px] mt-1">Quantité &gt; 0 requise</p>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
          className="w-full py-3 text-sm text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="size-4" /> Ajouter un article
        </button>

        {/* Options */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {(settings?.enable_global_discount || settings?.enable_commercial_discount) && (
            <div className="flex items-center gap-1.5 bg-white rounded-xl border px-3 py-2">
              <span className="text-xs text-zinc-500">{remiseLabel}</span>
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={commercialRate || ''}
                onChange={(e) => setCommercialRate(Number(e.target.value))}
                className="w-14 text-center text-sm py-1 outline-none"
                placeholder="%"
              />
              <span className="text-xs text-zinc-400">%</span>
            </div>
          )}
          {(settings?.enable_shipping) && (
            <div className="flex items-center gap-1.5 bg-white rounded-xl border px-3 py-2">
              <span className="text-xs text-zinc-500">Livraison</span>
              <input
                type="number"
                step="any"
                min="0"
                {...register('shippingFee', { valueAsNumber: true })}
                className="w-20 text-center text-sm py-1 outline-none"
                placeholder="FCFA"
              />
            </div>
          )}
          {(settings?.enable_line_discount) && (
            <button
              type="button"
              onClick={() => setShowDiscount(!showDiscount)}
              className={`text-xs px-3 py-2 rounded-xl border transition-colors ${showDiscount ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white hover:bg-zinc-50'}`}
            >
              {showDiscount ? 'Masquer rabais' : 'Rabais par ligne'}
            </button>
          )}
        </div>

        {/* Aperçu mobile */}
        <div className="md:hidden mt-4 bg-white rounded-2xl border border-zinc-200/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-zinc-500">{totalItems} article(s)</span>
            <span className="font-bold text-lg tabular-nums">{formatCurrency(previewCalc)}</span>
          </div>
          <InvoicePreview
            lines={watchedLines as any}
            settings={settings}
            globalDiscountRate={commercialRate}
            shippingFee={shippingFee}
          />
        </div>

        {submitError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-4">
            {submitError}
          </div>
        )}

        {/* Boutons desktop */}
        <div className="hidden md:flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {submitting ? 'Création...' : (editMode ? 'Enregistrer les modifications' : 'Créer la facture')}
          </button>
        </div>

        {/* Boutons mobile — inline dans le flux */}
        <div className="md:hidden mt-4 space-y-3 pb-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-zinc-900 text-white rounded-2xl text-base font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-sm active:scale-[0.98]"
          >
            {submitting ? 'Création de la facture...' : (editMode ? 'Enregistrer les modifications' : 'Créer la facture')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full py-3 border border-zinc-200 rounded-2xl text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </>
  );
}
