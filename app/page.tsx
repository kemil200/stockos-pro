import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/server';
import {
  Store, FileText, Package, Wallet, TrendingUp,
  Shield, Receipt, CreditCard, ArrowRight, Check,
  BarChart3, Warehouse, Clock, Globe,
} from 'lucide-react';

// En Next.js, redirect() lève une erreur interne de type NEXT_REDIRECT.
// Un catch {} sans discrimination l'avale silencieusement → l'utilisateur
// connecté voit la landing page au lieu d'être redirigé. On doit re-throw.
function isRedirectError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'digest' in err &&
    typeof (err as { digest: string }).digest === 'string' &&
    (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    try {
      const admin = createAdminClient();
      const { data: shops } = await admin
        .from('shops')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (shops?.length) {
        redirect('/invoices');
      }
      redirect('/onboarding');
    } catch (err) {
      // FIX: on laisse passer les redirections Next.js — elles ne sont pas des erreurs
      if (isRedirectError(err)) throw err;
      // Vraie erreur réseau / DB → fallback safe vers onboarding plutôt que la landing
      console.error('[Home] Erreur lors de la vérification du shop:', err);
      redirect('/onboarding');
    }
  }

  // Ici : utilisateur non authentifié → afficher la landing page normalement
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
              <Store className="size-4.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">StockOS Pro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-lg"
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all shadow-sm"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="pt-36 pb-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600 mb-6">
                  <Clock className="size-3" />
                  Pour les PME et commerces d&apos;Afrique de l&apos;Ouest
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
                  Gérez votre commerce
                  <br />
                  <span className="text-zinc-400">en toute simplicité</span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-500 max-w-lg leading-relaxed mb-8">
                  Facturation, gestion de stock, caisse enregistreuse et suivi des paiements.
                  Une solution complète conçue pour les PME ouest-africaines.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    Commencer maintenant
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className="px-6 py-3 text-sm font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/5 to-transparent rounded-2xl" />
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-1.5">
                      <div className="size-2.5 rounded-full bg-red-400" />
                      <div className="size-2.5 rounded-full bg-amber-400" />
                      <div className="size-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs text-zinc-400 font-medium">Tableau de bord</div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Factures', value: '24', change: '+12%' },
                        { label: 'Produits', value: '156', change: '+3%' },
                        { label: 'Revenus', value: '2.4M', change: '+18%' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-xl p-3 border border-zinc-200">
                          <div className="text-xs text-zinc-500 mb-1">{stat.label}</div>
                          <div className="text-lg font-bold text-zinc-900">{stat.value}</div>
                          <div className="text-xs text-emerald-600 font-medium">{stat.change}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 bg-zinc-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Tout ce qu&apos;il vous faut</h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Une suite complète d&apos;outils conçus pour les réalités des marchés africains.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Receipt, title: 'Facturation', desc: 'Créez et envoyez des factures professionnelles en quelques secondes.' },
                { icon: Package, title: 'Gestion de stock', desc: 'Suivez vos stocks en temps réel et recevez des alertes de rupture.' },
                { icon: Wallet, title: 'Caisse', desc: 'Point de vente intégré pour les ventes au comptoir.' },
                { icon: BarChart3, title: 'Rapports', desc: 'Analysez vos performances avec des tableaux de bord clairs.' },
                { icon: Shield, title: 'Sécurisé', desc: 'Vos données sont chiffrées et sauvegardées automatiquement.' },
                { icon: Globe, title: 'Multi-devises', desc: 'Travaillez en FCFA, EUR, USD et autres devises.' },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-6 border border-zinc-200 hover:shadow-md transition-shadow">
                  <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
                    <f.icon className="size-5 text-zinc-700" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-zinc-900 flex items-center justify-center">
              <Store className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">StockOS Pro</span>
          </div>
          <p className="text-xs text-zinc-400">© {new Date().getFullYear()} StockOS Pro. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
