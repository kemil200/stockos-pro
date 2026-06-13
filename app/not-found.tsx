import Link from 'next/link';
import { Store, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
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
        <div className="text-center max-w-sm">
          <p className="text-6xl font-heading font-bold text-zinc-300 mb-4">404</p>
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Page introuvable</h1>
          <p className="text-sm text-zinc-500 mb-8">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all"
            >
              <Home className="size-4" />
              Accueil
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all"
            >
              <ArrowLeft className="size-4" />
              Connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
