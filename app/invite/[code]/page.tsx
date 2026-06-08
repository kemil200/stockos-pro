import { acceptInvite } from '@/lib/actions/invites';
import { notFound } from 'next/navigation';
import { Store, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const result = await acceptInvite(code);

  if (!result.success) notFound();

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
          <div className="size-12 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Store className="size-6 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-heading font-bold tracking-tight mb-2">Rejoindre une boutique</h1>
          <p className="text-zinc-500 mb-8">
            Vous avez été invité à rejoindre <strong className="text-zinc-900">{result.shopName}</strong> sur StockOS Pro.
          </p>
          <Link
            href={`/sign-up?invite=${code}`}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-sm"
          >
            Créer mon compte
            <ArrowRight className="size-4" />
          </Link>
          <p className="text-xs text-zinc-400 mt-4">
            Déjà un compte ?{' '}
            <Link href={`/sign-in?invite=${code}`} className="text-zinc-900 font-medium underline underline-offset-4 hover:text-zinc-700">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
