'use client';

import { createClient } from '@/lib/client';
import { Store, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (data.session) {
      if (inviteCode) {
        const { completeInvite } = await import('@/lib/actions/invites');
        const result = await completeInvite(inviteCode, data.user!.id, name, email);
        if (result.success) {
          router.push('/invoices');
          router.refresh();
        } else {
          const supabase2 = createClient();
          await supabase2.auth.signOut();
          setError(result.error || 'Erreur');
          setLoading(false);
        }
      } else {
        router.push('/onboarding');
        router.refresh();
      }
    } else {
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
            <p className="text-sm text-zinc-500 mb-6">
              Un lien de confirmation a été envoyé à <strong>{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
            {inviteCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                <p className="text-sm font-medium text-amber-800 mb-2">Invitation en attente</p>
                <p className="text-xs text-amber-700 mb-3">
                  Après avoir confirmé votre email, revenez sur le lien d&apos;invitation pour être ajouté à la boutique.
                </p>
                <a
                  href={`/invite/${inviteCode}`}
                  className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-all"
                >
                  <ArrowRight className="size-3.5" />
                  Revenir au lien d&apos;invitation
                </a>
              </div>
            )}
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
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
