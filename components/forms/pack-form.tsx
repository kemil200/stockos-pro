'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { createPack, updatePack } from '@/lib/actions/packs';
import { formatCurrency } from '@/lib/utils/currency';

interface Product {
  id: string;
  name: string;
  unit_price: string;
  purchase_price: string;
  unit_type: string;
}

interface PackItem {
  productId: string;
  quantity: number;
}

interface Props {
  products: Product[];
  pack?: {
    id: string;
    name: string;
    sale_price: string;
    purchase_price: string;
    description: string | null;
    items?: { product_id: string; quantity: string; products?: { name: string } }[];
  };
}

export function PackForm({ products, pack }: Props) {
  const router = useRouter();
  const isEditing = !!pack;
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(pack?.name ?? '');
  const [salePrice, setSalePrice] = useState(pack ? Number(pack.sale_price) : 0);
  const [purchasePrice, setPurchasePrice] = useState(pack ? Number(pack.purchase_price) : 0);
  const [description, setDescription] = useState(pack?.description ?? '');
  const [items, setItems] = useState<PackItem[]>(
    pack?.items?.map((i) => ({
      productId: i.product_id,
      quantity: Number(i.quantity),
    })) ?? [{ productId: '', quantity: 1 }],
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, field: keyof PackItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: field === 'quantity' ? Number(value) || 1 : value } : item,
    ));
  }, []);

  const selectedProductIds = items.map((i) => i.productId).filter(Boolean);
  const computedCost = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (Number(product?.purchase_price ?? 0) * item.quantity);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('salePrice', String(salePrice));
      fd.append('purchasePrice', String(purchasePrice));
      fd.append('description', description);
      fd.append('items', JSON.stringify(items.filter((i) => i.productId)));

      let result;
      if (isEditing) {
        fd.append('packId', pack!.id);
        result = await updatePack(fd);
      } else {
        result = await createPack(fd);
      }

      if (result.success) {
        router.replace('/products/packs');
      } else {
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
          {isEditing ? 'Modifier le pack' : 'Nouveau pack'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          {isEditing ? 'Modifiez les informations du pack' : 'Composez un pack de produits'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nom du pack *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            placeholder="Ex: Pack rentrée scolaire"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            placeholder="Description du pack"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prix de vente *</label>
            <input
              type="number"
              step="any"
              min="0"
              value={salePrice || ''}
              onChange={(e) => setSalePrice(Number(e.target.value))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
              required
            />
          </div>
          <div className="space-y-2">
              <label className="text-sm font-medium">Prix d&apos;achat total</label>
            <input
              type="number"
              step="any"
              min="0"
              value={purchasePrice || ''}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
              placeholder="Coût total"
            />
            {computedCost > 0 && (
              <p className="text-[11px] text-zinc-400">
                Coût calculé des produits : {formatCurrency(computedCost)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700">Produits du pack</h2>
          <span className="text-xs text-zinc-400">{items.length} produit(s)</span>
        </div>

        {items.map((item, index) => {
          const selectedProduct = products.find((p) => p.id === item.productId);
          const isDuplicate = selectedProductIds.filter((id) => id === item.productId).length > 1;

          return (
            <div key={index} className="bg-white rounded-2xl border border-zinc-200/80 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-400 w-5">{index + 1}</span>
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  className={`flex-1 text-sm py-2.5 border-b focus:border-zinc-900 outline-none bg-transparent ${isDuplicate ? 'text-orange-600 border-orange-300' : 'border-zinc-200'}`}
                  required
                >
                  <option value="" disabled>Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit_type}) — Vente: {formatCurrency(Number(p.unit_price))}
                      {Number(p.purchase_price) > 0 ? ` / Achat: ${formatCurrency(Number(p.purchase_price))}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="p-2 text-zinc-300 hover:text-red-500 disabled:opacity-20 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500">Quantité</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                  className="w-20 text-center text-sm py-2 border rounded-xl focus:ring-2 focus:ring-zinc-900 outline-none"
                  required
                />
                {selectedProduct && (
                  <span className="text-xs text-zinc-400">
                    × {formatCurrency(Number(selectedProduct.purchase_price))} = {formatCurrency(Number(selectedProduct.purchase_price) * item.quantity)}
                  </span>
                )}
              </div>

              {isDuplicate && (
                <p className="text-[11px] text-orange-500">Ce produit est déjà dans le pack</p>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addItem}
          className="w-full py-3 text-sm text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl hover:border-zinc-400 hover:text-zinc-600 transition-colors flex items-center justify-center gap-1.5"
        >
          <Plus className="size-4" /> Ajouter un produit
        </button>
      </div>

      <div className="flex items-center justify-end gap-3">
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
          {submitting ? 'Enregistrement...' : isEditing ? 'Modifier le pack' : 'Créer le pack'}
        </button>
      </div>
    </form>
  );
}
