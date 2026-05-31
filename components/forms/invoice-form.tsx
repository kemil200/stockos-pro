'use client';

import { useState, useCallback, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { createInvoice } from '@/lib/actions/invoices';
import { getStockLevel } from '@/lib/actions/products';
import { InvoicePreview } from '@/components/invoices/invoice-preview';
import { formatCurrency } from '@/lib/utils/currency';

interface Product {
  id: string;
  name: string;
  unit_price: string;
}

interface FormLine {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate?: number;
}

interface InvoiceFormData {
  clientName: string;
  clientPhone: string;
  lines: FormLine[];
  globalDiscountRate?: number;
  shippingFee?: number;
}

interface Props {
  products: Product[];
  settings: any;
}

export function InvoiceForm({ products, settings }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [stockLevels, setStockLevels] = useState<Record<string, number>>({});

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      clientName: '',
      clientPhone: '',
      lines: [{ description: '', quantity: 1, unitPrice: 0 }],
      globalDiscountRate: 0,
      shippingFee: 0,
    },
  });

  const submitRef = useRef<(() => Promise<void>) | null>(null);

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = watch('lines');
  const globalDiscountRate = watch('globalDiscountRate');
  const shippingFee = watch('shippingFee');

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
      if (data.globalDiscountRate && data.globalDiscountRate > 0) fd.append('globalDiscountRate', String(data.globalDiscountRate / 100));
      if (data.shippingFee && data.shippingFee > 0) fd.append('shippingFee', String(data.shippingFee));

      const result = await createInvoice(fd);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      router.replace(`/invoices/${result.invoice.id}?print=true`);
    } catch {
      setSubmitError('Erreur réseau, veuillez réessayer');
    } finally {
      setSubmitting(false);
    }
  }, [router]);

  const handleFormError = () => {
    const el = formRef.current?.querySelector('[aria-invalid="true"], .text-red-500');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  submitRef.current = handleSubmit(onSubmit, handleFormError);

  const selectProduct = useCallback(async (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`lines.${index}.description`, product.name);
      setValue(`lines.${index}.unitPrice`, Number(product.unit_price));
      setValue(`lines.${index}.productId`, productId);
      const stock = await getStockLevel(productId);
      setStockLevels((prev) => ({ ...prev, [productId]: stock }));
    }
  }, [products, setValue]);

  const totalItems = watchedLines.reduce((s, l) => s + (l.quantity || 0), 0);
  const previewCalc = watchedLines.reduce((s, l) => s + (l.quantity || 0) * (l.unitPrice || 0), 0);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit, handleFormError)} className="pb-40 md:pb-8">
        {/* Client — minimal, sans titre */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 mb-4">
          <input
            {...register('clientName', { required: true })}
            className="w-full text-lg font-semibold py-3 border-b-2 border-zinc-200 focus:border-zinc-900 outline-none transition-colors placeholder:text-zinc-300 placeholder:font-normal"
            placeholder="Nom du client"
            autoFocus
          />
          {errors.clientName && <p className="text-red-500 text-xs mt-1.5 ml-1">Nom requis</p>}
          <input
            {...register('clientPhone')}
            className="w-full text-sm py-2.5 border-b border-zinc-100 focus:border-zinc-400 outline-none transition-colors placeholder:text-zinc-300 mt-2"
            placeholder="+228 90 00 00 00"
          />
        </div>

        {/* Lignes articles */}
        {fields.map((field, index) => {
          const selectedId = watchedLines[index]?.productId;
          const stock = selectedId ? stockLevels[selectedId] : undefined;
          const qty = watchedLines[index]?.quantity || 0;
          const overstock = stock !== undefined && qty > stock;

          return (
            <div key={field.id} className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 mb-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-zinc-400 w-5">{index + 1}</span>
                <select
                  className="flex-1 text-sm py-2.5 border-b border-zinc-200 focus:border-zinc-900 outline-none transition-colors bg-transparent"
                  onChange={(e) => selectProduct(index, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
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
                    step="1"
                    min="1"
                    {...register(`lines.${index}.quantity`, { valueAsNumber: true, required: true, min: 1 })}
                    className="w-16 text-center text-sm py-2.5 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  />
                  <span className="text-xs text-zinc-400">×</span>
                  <input
                    type="number"
                    step="1"
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
                      step="0.01"
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
          {(settings?.enable_global_discount) && (
            <div className="flex items-center gap-1.5 bg-white rounded-xl border px-3 py-2">
              <span className="text-xs text-zinc-500">Remise</span>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('globalDiscountRate', { valueAsNumber: true })}
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
                step="1"
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

        {/* Aperçu desktop */}
        <div className="hidden md:block mt-6">
          <InvoicePreview
            lines={watchedLines as any}
            settings={settings}
            globalDiscountRate={globalDiscountRate}
            shippingFee={shippingFee}
          />
        </div>

        {submitError && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mt-4">
            {submitError}
          </div>
        )}

        {/* Desktop submit */}
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
            {submitting ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </form>

      {/* Mobile sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 z-50 md:hidden safe-area-bottom">
        <button
          type="button"
          onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="text-sm text-zinc-500">{totalItems} article(s)</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tabular-nums">{formatCurrency(previewCalc)}</span>
            {mobilePreviewOpen ? <ChevronDown className="size-4 text-zinc-400" /> : <ChevronUp className="size-4 text-zinc-400" />}
          </div>
        </button>
        {mobilePreviewOpen && (
          <div className="px-4 pb-2">
            <InvoicePreview
              lines={watchedLines as any}
              settings={settings}
              globalDiscountRate={globalDiscountRate}
              shippingFee={shippingFee}
            />
          </div>
        )}
        <div className="flex gap-3 px-4 pb-4 pt-1">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitRef.current?.()}
            className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </>
  );
}
