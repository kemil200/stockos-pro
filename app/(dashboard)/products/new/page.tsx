'use client';

import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/actions/products';
import { getCategories, upsertCategory } from '@/lib/actions/categories';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [unitType, setUnitType] = useState('UNITY');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoryInput, setCategoryInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(categoryInput.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('unitType', unitType);

      const catName = categoryInput.trim();
      if (catName) {
        formData.set('category', catName);
        await upsertCategory(catName);
      }

      const result = await createProduct(formData);
      if (result.success) {
        router.replace('/products');
        router.refresh();
      } else {
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectCategory = (name: string) => {
    setCategoryInput(name);
    setShowDropdown(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nouveau produit</h1>
        <p className="text-sm text-muted-foreground">Ajoutez un produit à votre catalogue</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations produit</CardTitle>
            <CardDescription>Renseignez les détails du produit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom *</label>
              <Input name="name" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input name="sku" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Code-barres</label>
                <Input name="barcode" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea name="description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix de vente *</label>
                <Input name="unitPrice" type="number" step="1" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prix d'achat</label>
                <Input name="purchasePrice" type="number" step="1" placeholder="Coût de revient" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unité</label>
                <Select value={unitType} onValueChange={(v) => v && setUnitType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNITY">Unité</SelectItem>
                    <SelectItem value="KG">Kg</SelectItem>
                    <SelectItem value="LITER">Litre</SelectItem>
                    <SelectItem value="METER">Mètre</SelectItem>
                    <SelectItem value="BOX">Boîte</SelectItem>
                    <SelectItem value="PACK">Pack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">Catégorie *</label>
                <div className="relative">
                  <input
                    value={categoryInput}
                    onChange={(e) => {
                      setCategoryInput(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
                    placeholder="Rechercher ou créer..."
                    required
                    autoComplete="off"
                  />
                  {showDropdown && categoryInput && filteredCategories.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCategory(c.name)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 transition-colors ${c.name === categoryInput ? 'bg-zinc-50 font-medium' : ''}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && categoryInput && filteredCategories.length === 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg p-3">
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Plus className="size-3" />
                        Créer &quot;{categoryInput}&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <div className="flex items-center justify-end gap-3 px-4 py-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Création...' : 'Créer le produit'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
