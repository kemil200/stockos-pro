'use client';

import { createClient } from '@/lib/client';
import { Store, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const inviteCode = searchParams.get('invite');
    if (inviteCode && data.user) {
      const { completeInvite } = await import('@/lib/actions/invites');
      const result = await completeInvite(inviteCode, data.user.id, data.user.user_metadata?.name || email, email);
      if (!result.success) {
        await supabase.auth.signOut();
        setError(result.error || 'Impossible de rejoindre la boutique');
        setLoading(false);
        return;
      }
    }

    const redirectTo = searchParams.get('redirect') || '/invoices';
    router.push(redirectTo);
    router.refresh();
  };

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
            <h1 className="text-2xl font-bold tracking-tight mb-2">Connexion</h1>
            <p className="text-sm text-zinc-500">Accédez à votre espace de gestion</p>
          </div>
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  {loading ? 'Connexion...' : 'Se connecter'}
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
                <p className="text-sm text-center text-zinc-500">
                  Pas encore de compte ?{' '}
                  <Link href="/sign-up" className="text-zinc-900 font-medium underline underline-offset-4 hover:text-zinc-700">
                    Créer un compte
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
