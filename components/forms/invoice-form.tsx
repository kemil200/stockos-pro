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

      const formData = new FormData();
      formData.append('clientName', data.clientName);
      if (data.clientPhone) formData.append('clientPhone', data.clientPhone);
      formData.append('lines', JSON.stringify(linesWithDecimalDiscount));
      if (data.globalDiscountRate && data.globalDiscountRate > 0) formData.append('globalDiscountRate', String(data.globalDiscountRate / 100));
      if (data.shippingFee && data.shippingFee > 0) formData.append('shippingFee', String(data.shippingFee));

      const result = await createInvoice(formData);

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      router.replace(`/invoices/${result.invoice.id}?print=true`);
    } catch {
      setSubmitError('Une erreur inattendue est survenue');
    } finally {
      setSubmitting(false);
    }
  }, [router]);

  submitRef.current = handleSubmit(onSubmit);

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
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-36 md:pb-6">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Client</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Client *</label>
              <input
                {...register('clientName', { required: true })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="Nom du client"
              />
              {errors.clientName && <p className="text-red-500 text-xs mt-1">Requis</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Téléphone</label>
              <input
                {...register('clientPhone')}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
                placeholder="+228 XX XX XX XX"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Articles</h2>
            <div className="flex items-center gap-2">
              {(settings?.enable_line_discount) && (
                <button
                  type="button"
                  onClick={() => setShowDiscount(!showDiscount)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${showDiscount ? 'bg-zinc-900 text-white border-zinc-900' : 'hover:bg-zinc-50'}`}
                >
                  -%
                </button>
              )}
              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50"
              >
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>
          </div>

          {fields.map((field, index) => {
            const selectedId = watchedLines[index]?.productId;
            const stock = selectedId ? stockLevels[selectedId] : undefined;
            const qty = watchedLines[index]?.quantity || 0;
            const overstock = stock !== undefined && qty > stock;

            return (
              <div key={field.id} className="flex gap-2 items-start p-3 border rounded-lg flex-wrap">
                <select
                  className="w-full sm:w-40 px-3 py-2 border rounded-lg text-sm"
                  onChange={(e) => selectProduct(index, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Sélectionner</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  {...register(`lines.${index}.description`, { required: true })}
                  className="flex-1 min-w-[120px] px-3 py-2 border rounded-lg text-sm"
                  placeholder="Description"
                />

                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    {...register(`lines.${index}.quantity`, { valueAsNumber: true, required: true, min: 1 })}
                    className="w-16 px-3 py-2 border rounded-lg text-sm"
                    placeholder="Qté"
                  />
                  {stock !== undefined && (
                    <span className={`text-[11px] ${overstock ? 'text-orange-500 font-medium' : 'text-zinc-400'}`}>
                      Stock: {stock}
                    </span>
                  )}
                  {errors.lines?.[index]?.quantity && (
                    <p className="text-red-500 text-[11px]">Quantité &gt; 0 requise</p>
                  )}
                </div>

                <input
                  type="number"
                  step="1"
                  {...register(`lines.${index}.unitPrice`, { valueAsNumber: true, required: true })}
                  className="w-24 px-3 py-2 border rounded-lg text-sm"
                  placeholder="Prix"
                />

                {showDiscount && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...register(`lines.${index}.discountRate`, { valueAsNumber: true })}
                      className="w-14 px-2 py-2 border rounded-lg text-sm"
                      placeholder="%"
                    />
                    <span className="text-xs text-zinc-400">%</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border p-6 space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            {(settings?.enable_global_discount) && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 whitespace-nowrap">Remise globale</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('globalDiscountRate', { valueAsNumber: true })}
                    className="w-16 px-2 py-2 border rounded-lg text-sm"
                    placeholder="%"
                  />
                  <span className="text-xs text-zinc-400">%</span>
                </div>
              </div>
            )}
            {(settings?.enable_shipping) && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-600 whitespace-nowrap">Frais de port</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  {...register('shippingFee', { valueAsNumber: true })}
                  className="w-20 px-2 py-2 border rounded-lg text-sm"
                  placeholder="Montant"
                />
              </div>
            )}
          </div>
        </div>

        <div className="hidden md:block">
          <InvoicePreview
            lines={watchedLines as any}
            settings={settings}
            globalDiscountRate={globalDiscountRate}
            shippingFee={shippingFee}
          />
        </div>

        {submitError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="hidden md:flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-zinc-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </form>

      {/* Mobile sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 md:hidden">
        <button
          type="button"
          onClick={() => setMobilePreviewOpen(!mobilePreviewOpen)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">{totalItems} article(s)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{formatCurrency(previewCalc)}</span>
            {mobilePreviewOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
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
        <div className="flex gap-3 px-4 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium hover:bg-zinc-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => submitRef.current?.()}
            className="flex-1 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </div>
    </>
  );
}
