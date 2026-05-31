import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { db } from '@/lib/db';
import { shops } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Store, FileText, Package, Wallet, TrendingUp, Shield, Receipt, CreditCard } from 'lucide-react';

export default async function Home() {
  const { userId, orgId } = await auth();

  if (userId) {
    if (!orgId) redirect('/onboarding');
    const [shop] = await db.select().from(shops).where(eq(shops.clerkOrgId, orgId));
    if (!shop) redirect('/onboarding');
    redirect('/invoices');
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="px-6 py-4 bg-white border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Store className="size-5 text-white" />
            </div>
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
        </div>
      </header>

      <main className="flex-1">
        <section className="px-6 py-24 bg-gradient-to-b from-white to-zinc-50">
          <div className="max-w-4xl mx-auto text-center">
            <div className="size-20 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Store className="size-10 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
              Gérez votre commerce
              <br />
              <span className="text-zinc-400">en toute simplicité</span>
            </h1>
            <p className="text-lg text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              Facturation, gestion de stock, caisse enregistreuse et suivi des paiements.
              Une solution complète conçue pour les PME et commerces en Afrique de l&apos;Ouest.
            </p>
            <div className="flex items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <button className="px-8 py-3.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl">
                  Commencer maintenant
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="px-8 py-3.5 text-sm font-medium border rounded-xl hover:bg-white transition-colors">
                  Se connecter
                </button>
              </SignInButton>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Tout ce qu&apos;il vous faut</h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Les outils essentiels pour gérer votre commerce au quotidien
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-xl border bg-zinc-50">
                <div className="size-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                  <FileText className="size-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Facturation</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Créez des factures professionnelles en quelques clics. Gestion des remises, TVA, avoirs et suivi des paiements.
                </p>
              </div>
              <div className="p-6 rounded-xl border bg-zinc-50">
                <div className="size-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                  <Package className="size-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Stock</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Suivez vos stocks en temps réel. Alertes de stock bas et mouvements tracés par produit.
                </p>
              </div>
              <div className="p-6 rounded-xl border bg-zinc-50">
                <div className="size-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                  <Wallet className="size-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Caisse</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Journal de caisse complet avec solde courant. Encaissements et dépenses enregistrés automatiquement.
                </p>
              </div>
              <div className="p-6 rounded-xl border bg-zinc-50">
                <div className="size-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                  <CreditCard className="size-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Paiements</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Enregistrez les paiements partiels ou totaux. Suivi des impayés et historique complet.
                </p>
              </div>
              <div className="p-6 rounded-xl border bg-zinc-50">
                <div className="size-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                  <TrendingUp className="size-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Rapports</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Statistiques de vues, revenus, dépenses et résultat net sur 30 jours.
                </p>
              </div>
              <div className="p-6 rounded-xl border bg-zinc-50">
                <div className="size-10 rounded-lg bg-zinc-900 flex items-center justify-center mb-4">
                  <Receipt className="size-5 text-white" />
                </div>
                <h3 className="font-semibold mb-2">Multidevises</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Support XOF, EUR, USD, GBP. Adapté aux commerces de la zone UEMOA et CEDEAO.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 bg-zinc-900 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Prêt à démarrer ?</h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
              Créez votre boutique en quelques secondes. Aucune carte bancaire requise.
            </p>
            <SignUpButton mode="modal">
              <button className="px-8 py-3.5 text-sm font-medium bg-white text-zinc-900 rounded-xl hover:bg-zinc-100 transition-colors shadow-lg">
                Créer ma boutique gratuitement
              </button>
            </SignUpButton>
          </div>
        </section>
      </main>

      <footer className="px-6 py-6 bg-white border-t">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-zinc-400">
          <span>&copy; {new Date().getFullYear()} StockOS Pro</span>
          <div className="flex items-center gap-6">
            <a href="/superadmin" className="flex items-center gap-1.5 hover:text-zinc-600 transition-colors">
              <Shield className="size-3.5" />
              Superadmin
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
