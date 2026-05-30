import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Store, Shield } from 'lucide-react';

export default async function Home() {
  const { userId, orgId } = await auth();

  if (userId) {
    if (!orgId) redirect('/onboarding');
    redirect('/invoices');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Store className="size-6" />
          StockOS Pro
        </div>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
              Connexion
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              Créer un compte
            </button>
          </SignUpButton>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-3xl mx-auto">
        <div className="size-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-8">
          <Store className="size-8 text-white" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Gérez votre commerce en toute simplicité
        </h1>
        <p className="text-lg text-zinc-500 mb-8 max-w-xl">
          Facturation, stock, caisse et paiements — une solution complète pour les PME en Afrique de l&apos;Ouest.
        </p>
        <div className="flex items-center gap-4">
          <SignUpButton mode="modal">
            <button className="px-6 py-3 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
              Commencer maintenant
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="px-6 py-3 text-sm font-medium border rounded-lg hover:bg-zinc-50 transition-colors">
              Se connecter
            </button>
          </SignInButton>
        </div>
      </main>

      <footer className="px-6 py-4 border-t">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>&copy; {new Date().getFullYear()} StockOS Pro</span>
          <a href="/superadmin" className="flex items-center gap-1 hover:text-zinc-600 transition-colors">
            <Shield className="size-3" />
            Superadmin
          </a>
        </div>
      </footer>
    </div>
  );
}
