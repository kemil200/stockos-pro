'use client';

import { createClient } from '@/lib/client';
import { Store } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function OnboardingCreateShop() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      const res = await fetch('/api/setup-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), slug, userId: user.id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur lors de la création');
      }

      router.push('/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="size-12 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Store className="size-6 text-white" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Créez votre boutique</CardTitle>
            <CardDescription>Donnez un nom à votre commerce pour commencer</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="shop-name" className="text-sm font-medium">Nom de la boutique</label>
                <Input
                  id="shop-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Boutique de Kémil"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Création en cours...' : 'Créer ma boutique'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
