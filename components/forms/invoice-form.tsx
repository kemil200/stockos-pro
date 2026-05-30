'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Trash2, Plus } from 'lucide-react';
import { createInvoice } from '@/lib/actions/invoices';
import { InvoicePreview } from '@/components/invoices/invoice-preview';

interface Product {
  id: string;
  name: string;
  unitPrice: string;
}

interface FormData {
  clientName: string;
  clientPhone: string;
  lines: { productId?: string; description: string; quantity: number; unitPrice: number; discountRate?: number }[];
}

interface Props {
  products: Product[];
  settings: any;
}

export function InvoiceForm({ products, settings }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      clientName: '',
      clientPhone: '',
      lines: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = watch('lines');

  const onSubmit = useCallback(async (data: FormData) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('clientName', data.clientName);
      if (data.clientPhone) formData.append('clientPhone', data.clientPhone);
      formData.append('lines', JSON.stringify(data.lines));

      const result = await createInvoice(formData);
      router.push(`/invoices/${result.invoice.id}`);
    } finally {
      setSubmitting(false);
    }
  }, [router]);

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`lines.${index}.description`, product.name);
      setValue(`lines.${index}.unitPrice`, Number(product.unitPrice));
      setValue(`lines.${index}.productId`, productId);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          <button
            type="button"
            onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-3 items-start p-3 border rounded-lg">
            <select
              className="w-44 px-3 py-2 border rounded-lg text-sm"
              onChange={(e) => selectProduct(index, e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Sélectionner un produit</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {Number(p.unitPrice).toLocaleString()} FCFA
                </option>
              ))}
            </select>

            <input
              {...register(`lines.${index}.description`, { required: true })}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
              placeholder="Description"
            />

            <input
              type="number"
              step="0.01"
              {...register(`lines.${index}.quantity`, { valueAsNumber: true, required: true })}
              className="w-20 px-3 py-2 border rounded-lg text-sm"
              placeholder="Qté"
            />

            <input
              type="number"
              step="1"
              {...register(`lines.${index}.unitPrice`, { valueAsNumber: true, required: true })}
              className="w-28 px-3 py-2 border rounded-lg text-sm"
              placeholder="Prix"
            />

            <button
              type="button"
              onClick={() => remove(index)}
              disabled={fields.length === 1}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <InvoicePreview lines={watchedLines as any} settings={settings} />

      <div className="flex justify-end gap-3">
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
  );
}
