'use client';

import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/actions/products';
import { useState } from 'react';

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createProduct(formData);
      router.push('/products');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouveau produit</h1>
        <p className="text-zinc-500 text-sm">Ajoutez un produit à votre catalogue</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Nom *</label>
          <input name="name" required className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">SKU</label>
            <input name="sku" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Code-barres</label>
            <input name="barcode" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
          <textarea name="description" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Prix unitaire *</label>
            <input name="unitPrice" type="number" step="1" required className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Unité</label>
            <select name="unitType" className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="UNITY">Unité</option>
              <option value="KG">Kg</option>
              <option value="LITER">Litre</option>
              <option value="METER">Mètre</option>
              <option value="BOX">Boîte</option>
              <option value="PACK">Pack</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Catégorie</label>
          <input name="category" className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded-lg text-sm">
            Annuler
          </button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {submitting ? 'Création...' : 'Créer'}
          </button>
        </div>
      </form>
    </div>
  );
}
