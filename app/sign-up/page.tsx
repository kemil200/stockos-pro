'use client';

import { createClient } from '@/lib/client';
import { Store, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Message de succès pour les providers qui exigent une confirmation par email
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Supabase peut retourner un user sans session si "Confirm email" est activé
    // Dans ce cas, on affiche un message plutôt que de rediriger vers une page protégée
    if (data.session) {
      // Session immédiate → redirection directe
      router.push('/onboarding');
      router.refresh();
    } else {
      // Email de confirmation envoyé → on informe l'utilisateur
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50">
        <header className="px-6 h-14 flex items-center border-b bg-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
              <Store className="size-4 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">StockOS Pro</span>
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="size-6 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Vérifiez votre email</h1>
            <p className="text-sm text-zinc-500">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <header className="px-6 h-14 flex items-center border-b bg-white">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
            <Store className="size-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">StockOS Pro</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">Créer un compte</h1>
            <p className="text-sm text-zinc-500">Gérez votre commerce en toute simplicité</p>
          </div>
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                    Nom
                  </label>
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                    Mot de passe
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                <Button type="submit" disabled={loading} className="w-full gap-2">
                  {loading ? 'Création...' : 'Créer mon compte'}
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
                <p className="text-sm text-center text-zinc-500">
                  Déjà un compte ?{' '}
                  <Link href="/sign-in" className="text-zinc-900 font-medium underline underline-offset-4 hover:text-zinc-700">
                    Se connecter
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
