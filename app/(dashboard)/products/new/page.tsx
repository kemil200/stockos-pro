'use client';

import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/actions/products';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [unitType, setUnitType] = useState('UNITY');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.set('unitType', unitType);
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
                <label className="text-sm font-medium">Prix unitaire *</label>
                <Input name="unitPrice" type="number" step="1" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unité</label>
                <Select value={unitType} onValueChange={(v) => v && setUnitType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Input name="category" />
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
