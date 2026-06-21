'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X, Receipt, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductInput } from './product-input';
import { createQuickInvoice } from '@/lib/actions/invoices';
import { formatCurrency } from '@/lib/utils/currency';

interface LineField {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

interface FormValues {
  clientName: string;
  lines: LineField[];
}

interface Product {
  id: string;
  name: string;
  unit_price: string;
}

export function SaleForm({ products }: { products: Product[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [lastClient, setLastClient] = useState('');
  const router = useRouter();

  const form = useForm<FormValues>({
    defaultValues: {
      clientName: '',
      lines: [{ description: '', quantity: 1, unitPrice: '', productId: undefined }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'lines' });
  const lines = form.watch('lines');

  const total = lines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const canSubmit = total > 0 && lines.some((l) => l.description.trim().length > 0);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('clientName', data.clientName || 'Client');
      formData.set(
        'lines',
        JSON.stringify(
          data.lines.map((l) => ({
            productId: l.productId || undefined,
            description: l.description.trim() || 'Article',
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice) || 0,
          }))
        )
      );

      const result = await createQuickInvoice(formData);
      if (result.success) {
        toast.success('Vente enregistrée');
        setLastClient(data.clientName);
        form.reset({
          clientName: data.clientName,
          lines: [{ description: '', quantity: 1, unitPrice: '', productId: undefined }],
        });
        router.refresh();
      } else {
        toast.error(result.error || 'Erreur lors de la vente');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setSubmitting(false);
    }
  };

  const addLine = () => {
    append({ description: '', quantity: 1, unitPrice: '', productId: undefined });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && index === fields.length - 1) {
      e.preventDefault();
      addLine();
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Client name */}
      <div>
        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          Client
        </label>
        <input
          {...form.register('clientName')}
          placeholder="Nom du client (optionnel)"
          autoComplete="off"
          className="w-full border-0 border-b-2 border-zinc-200 bg-transparent px-0 py-2 text-base focus:border-zinc-900 focus:outline-none focus:ring-0 placeholder:text-zinc-300"
        />
      </div>

      {/* Lines */}
      <div className="space-y-3">
        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
          Articles
        </label>
        {fields.map((field, index) => {
          const lineDescription = form.watch(`lines.${index}.description`);
          const lineQuantity = Number(form.watch(`lines.${index}.quantity`)) || 0;
          const linePrice = Number(form.watch(`lines.${index}.unitPrice`)) || 0;
          const lineTotal = lineQuantity * linePrice;

          return (
            <div
              key={field.id}
              className="flex items-start gap-2 sm:gap-3"
            >
              <span className="text-xs font-medium text-zinc-400 w-5 shrink-0 text-right tabular-nums pt-2.5">
                {index + 1}.
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <ProductInput
                    products={products}
                    value={lineDescription}
                    onChange={(product) => {
                      form.setValue(`lines.${index}.productId`, product.id);
                      form.setValue(`lines.${index}.description`, product.name);
                      if (product.price) form.setValue(`lines.${index}.unitPrice`, product.price);
                    }}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-zinc-400 shrink-0">×</span>
                  <input
                    {...form.register(`lines.${index}.quantity`)}
                    type="number"
                    step="any"
                    min="0"
                    className="w-16 text-center border border-zinc-200 rounded-lg px-1.5 py-1.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <span className="text-xs text-zinc-400 shrink-0">à</span>
                  <input
                    {...form.register(`lines.${index}.unitPrice`)}
                    type="number"
                    step="any"
                    min="0"
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    placeholder="Prix"
                    className="w-24 text-right border border-zinc-200 rounded-lg px-2 py-1.5 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                  <span className="text-xs text-zinc-400 shrink-0">=</span>
                  <span className="text-sm font-medium text-zinc-900 tabular-nums min-w-[60px] text-right">
                    {lineTotal.toLocaleString('fr-FR')} F
                  </span>
                </div>
              </div>

              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1.5 mt-2 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add line */}
      <button
        type="button"
        onClick={addLine}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-900 transition-colors py-1"
      >
        <Plus className="size-4" />
        Ajouter un article
      </button>

      {/* Total */}
      <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
        <span className="text-sm font-medium text-zinc-500">Total</span>
        <span className="text-xl font-bold font-heading tracking-tight tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11 text-sm font-medium"
        disabled={submitting || !canSubmit}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Receipt className="size-4" />
            Valider la vente
          </>
        )}
      </Button>
    </form>
  );
}
