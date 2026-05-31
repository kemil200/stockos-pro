import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  Store, FileText, Package, Wallet, TrendingUp,
  Shield, Receipt, CreditCard, ArrowRight, Check,
  BarChart3, Warehouse, Clock, Globe,
} from 'lucide-react';

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: shops } = await admin.from('shops').select('id').eq('user_id', user.id).limit(1);
      if (shops?.length) redirect('/invoices');
      redirect('/onboarding');
    } catch {
      // fallback: show landing page
    }
  }

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
                        { label: 'Stock', value: '156', change: '-3%' },
                        { label: 'Revenus', value: '2.4M', change: '+8%' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-lg bg-white border p-3">
                          <div className="text-[11px] text-zinc-400 font-medium mb-0.5">{stat.label}</div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-zinc-900">{stat.value}</span>
                            <span className={`text-[11px] font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
                              {stat.change}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-white border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-zinc-500">Dernières factures</span>
                        <span className="text-[11px] text-zinc-400">Aujourd&apos;hui</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { ref: 'INV-2024-001', client: 'Alpha SARL', amount: '450 000 XOF', status: 'Payée' },
                          { ref: 'INV-2024-002', client: 'Beta Distribution', amount: '230 000 XOF', status: 'En attente' },
                          { ref: 'INV-2024-003', client: 'Gamma Store', amount: '89 500 XOF', status: 'Payée' },
                        ].map((inv) => (
                          <div key={inv.ref} className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0">
                            <div>
                              <div className="text-sm font-medium text-zinc-900">{inv.client}</div>
                              <div className="text-[11px] text-zinc-400">{inv.ref}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-zinc-900">{inv.amount}</div>
                              <div className={`text-[11px] font-medium ${inv.status === 'Payée' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {inv.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 bg-zinc-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Tout ce qu&apos;il vous faut pour gérer votre commerce
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
                Des outils professionnels conçus pour simplifier la gestion quotidienne de votre entreprise.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: FileText,
                  title: 'Facturation',
                  desc: 'Créez des factures en quelques clics. Gérez les avoirs, remises, TVA, et suivez les paiements.',
                  color: 'bg-blue-50 text-blue-600',
                },
                {
                  icon: Package,
                  title: 'Produits',
                  desc: 'Catalogue produits complet avec prix d\'achat et vente. Gérez vos stocks et réapprovisionnements.',
                  color: 'bg-emerald-50 text-emerald-600',
                },
                {
                  icon: Warehouse,
                  title: 'Stock',
                  desc: 'Suivi en temps réel des mouvements. Alertes automatiques sur les stocks bas et ruptures.',
                  color: 'bg-amber-50 text-amber-600',
                },
                {
                  icon: Wallet,
                  title: 'Caisse',
                  desc: 'Journal de caisse avec solde courant. Encaissements et dépenses tracés automatiquement.',
                  color: 'bg-violet-50 text-violet-600',
                },
                {
                  icon: CreditCard,
                  title: 'Paiements',
                  desc: 'Enregistrez paiements partiels ou totaux. Suivi des impayés et historique complet.',
                  color: 'bg-rose-50 text-rose-600',
                },
                {
                  icon: Globe,
                  title: 'Multidevises',
                  desc: 'Support XOF, EUR, USD, GBP. Idéal pour les commerces de la zone UEMOA et CEDEAO.',
                  color: 'bg-cyan-50 text-cyan-600',
                },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="group relative rounded-xl border border-zinc-200 bg-white p-6 hover:border-zinc-300 hover:shadow-sm transition-all"
                >
                  <div className={`inline-flex size-10 rounded-lg items-center justify-center ${color} mb-4`}>
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 mb-2">{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                Pourquoi choisir StockOS Pro ?
              </h2>
              <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
                Une solution pensée pour les réalités du commerce en Afrique de l&apos;Ouest.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[
                { icon: BarChart3, title: 'Rapports détaillés', desc: 'Visualisez vos revenus, dépenses et résultat net sur 30 jours avec des graphiques clairs.' },
                { icon: Check, title: 'Hors ligne possible', desc: 'Génération de factures en PDF côté client. Pas besoin de connexion permanente.' },
                { icon: Globe, title: 'Adapté à la région', desc: 'TVA, multidevises, et options de paiement adaptés aux marchés UEMOA et CEDEAO.' },
                { icon: Shield, title: 'Sécurisé', desc: 'Authentification Supabase, données chiffrées, et sauvegardes automatiques.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-5">
                  <div className="shrink-0 size-11 rounded-xl bg-zinc-100 flex items-center justify-center">
                    <Icon className="size-5 text-zinc-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 mb-1">{title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 bg-zinc-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Prêt à développer votre commerce ?
            </h2>
            <p className="text-zinc-400 mb-10 max-w-lg mx-auto leading-relaxed">
              Créez votre boutique en quelques secondes. Aucune carte bancaire requise.
              Commencez gratuitement.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium bg-white text-zinc-900 rounded-xl hover:bg-zinc-100 transition-all shadow-lg"
            >
              Créer ma boutique gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8 border-t bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-zinc-900 flex items-center justify-center">
              <Store className="size-3.5 text-white" />
            </div>
            <span className="font-medium text-zinc-600">StockOS Pro</span>
          </div>
          <div className="flex items-center gap-6">
            <span>&copy; {new Date().getFullYear()} StockOS Pro. Tous droits réservés.</span>
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
