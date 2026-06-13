'use client';

import { Store, ArrowRight, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { validateResetToken, resetPassword } from '@/lib/actions/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
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
          <p className="text-sm text-zinc-500">Chargement...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [valid, setValid] = useState(false);
  const [checking, setChecking] = useState(true);

  const validate = useCallback(async (t: string) => {
    setChecking(true);
    const result = await validateResetToken(t);
    if (result.success) {
      setValid(true);
    } else {
      setError(result.error || 'Lien invalide.');
    }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (token) {
      validate(token);
    } else {
      setError('Aucun token de réinitialisation fourni.');
      setChecking(false);
    }
  }, [token, validate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    const result = await resetPassword(token, password);

    if (!result.success) {
      setError(result.error || 'Erreur lors de la réinitialisation.');
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);

    setTimeout(() => {
      router.push('/sign-in');
      router.refresh();
    }, 2000);
  };

  if (done) {
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
            <h1 className="text-xl font-bold mb-2">Mot de passe modifié</h1>
            <p className="text-sm text-zinc-500">Votre mot de passe a été changé avec succès. Redirection vers la connexion...</p>
          </div>
        </div>
      </div>
    );
  }

  if (checking) {
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
            <p className="text-sm text-zinc-500">Vérification du lien de réinitialisation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!valid || error) {
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
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-6">
              <p className="text-sm text-red-700">{error || 'Lien invalide ou expiré.'}</p>
            </div>
            <Link href="/forgot-password" className="text-sm text-zinc-900 font-medium underline underline-offset-4 hover:text-zinc-700">
              Demander un nouveau lien
            </Link>
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
            <h1 className="text-2xl font-bold tracking-tight mb-2">Nouveau mot de passe</h1>
            <p className="text-sm text-zinc-500">Choisissez un nouveau mot de passe</p>
          </div>
          <Card className="border-zinc-200 shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-zinc-700">Mot de passe</label>
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors" tabIndex={-1}>
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
                  {loading ? 'Modification...' : 'Changer le mot de passe'}
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
                <Link href="/sign-in" className="flex items-center justify-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                  <ArrowLeft className="size-3.5" />
                  Retour à la connexion
                </Link>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
