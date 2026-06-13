import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/server';
import { JsonLd } from '@/components/seo/json-ld';
import { PricingSection } from '@/components/pricing-section';
import {
  Store, FileText, Package, Wallet, TrendingUp,
  Shield, Receipt, CreditCard, ArrowRight, Check,
  BarChart3, Warehouse, Clock, Globe, Sparkles,
  ChevronRight, Star, Smartphone, Download,
} from 'lucide-react';

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
    if (user.app_metadata?.role === 'SUPERADMIN') {
      redirect('/superadmin');
    }
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
      if (isRedirectError(err)) throw err;
      console.error('[Home] Erreur lors de la vérification du shop:', err);
      redirect('/onboarding');
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/50 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-zinc-900 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <Store className="size-4.5 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-sm tracking-tight">StockOS Pro</span>
              <p className="text-[10px] text-zinc-400 leading-none -mt-0.5">Gestion commerciale</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors rounded-xl"
            >
              Connexion
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-sm hover:shadow-md"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1" itemScope itemType="https://schema.org/SoftwareApplication">
        <JsonLd />
        {/* Hero */}
        <section className="relative pt-40 pb-28 lg:pt-48 lg:pb-32 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.97_0_0)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_oklch(0.97_0_0)_0%,_transparent_50%)]" />
          <div className="max-w-7xl mx-auto relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600 mb-8 animate-in">
                <Sparkles className="size-3" />
                Pour les PME et commerces d&apos;Afrique de l&apos;Ouest
              </div>
              <h1 className="text-[clamp(2.25rem,6vw,4.5rem)] font-heading font-bold tracking-tight leading-[1.05] mb-6">
                Gérez votre commerce
                <br />
                <span className="text-zinc-400">en toute simplicité</span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed mb-10">
                Facturation, gestion de stock, caisse enregistreuse et suivi des paiements.
                Une solution complète conçue pour les réalités des PME ouest-africaines.
                <span className="block mt-3 text-sm text-zinc-400">
                  Accessible depuis votre téléphone, sans installation. Installez-le sur votre écran d&apos;accueil en un clic.
                </span>
                <span className="block mt-2 text-sm text-zinc-400">
                  Disponible à Lomé, Abidjan, Dakar, Cotonou, Ouagadougou, Bamako, Niamey, Conakry, Accra, Lagos et partout en Afrique de l&apos;Ouest.
                </span>
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
                >
                  Commencer maintenant
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all hover:border-zinc-300"
                >
                  Se connecter
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Mockup dashboard */}
            <div className="mt-16 lg:mt-20 max-w-4xl mx-auto bg-zinc-900/5 backdrop-blur-sm rounded-2xl border border-zinc-200/70 p-4 sm:p-6 shadow-xl animate-in">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-400" />
                  <div className="size-2.5 rounded-full bg-amber-400" />
                  <div className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs text-zinc-400 font-medium">Tableau de bord</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Factures', value: '24', change: '+12%', color: 'text-blue-600' },
                  { label: 'Produits', value: '156', change: '+3%', color: 'text-emerald-600' },
                  { label: 'Revenus', value: '2.4M FCFA', change: '+18%', color: 'text-violet-600' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-xl p-4 border border-zinc-200/80 hover:border-zinc-300 transition-colors">
                    <div className="text-xs text-zinc-500 mb-1.5 font-medium">{stat.label}</div>
                    <div className="text-xl sm:text-2xl font-bold text-zinc-900 font-heading tracking-tight">{stat.value}</div>
                    <div className={cn('text-xs font-semibold mt-1', stat.color)}>{stat.change}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-zinc-200/60 overflow-hidden">
                <div className="h-full w-3/5 rounded-full bg-zinc-900/20" />
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 lg:py-32 px-6 bg-zinc-50/80">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 lg:mb-20">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 block">Fonctionnalités</span>
              <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-heading font-bold tracking-tight mb-4">
                Tout ce qu&apos;il vous faut
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto text-base lg:text-lg">
                Une suite complète d&apos;outils conçus pour les réalités des marchés ouest-africains&nbsp;: Togo, Bénin, Côte d&apos;Ivoire, Sénégal, Guinée, Mali, Burkina Faso, Niger, Ghana, Nigeria.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
              {[
                { icon: Receipt, title: 'Facturation', desc: 'Créez et envoyez des factures professionnelles en quelques secondes.', accent: 'bg-zinc-900 text-white' },
                { icon: Package, title: 'Gestion de stock', desc: 'Suivez vos stocks en temps réel et recevez des alertes de rupture.', accent: 'bg-zinc-800 text-white' },
                { icon: Wallet, title: 'Caisse enregistreuse', desc: 'Point de vente intégré pour les ventes au comptoir.', accent: 'bg-zinc-700 text-white' },
                { icon: TrendingUp, title: 'Rapports', desc: 'Analysez vos performances avec des tableaux de bord clairs.', accent: 'bg-zinc-900 text-white' },
                { icon: Shield, title: 'Sécurisé', desc: 'Vos données sont chiffrées et sauvegardées automatiquement.', accent: 'bg-zinc-800 text-white' },
                { icon: Globe, title: 'Multi-devises', desc: 'Travaillez en FCFA, EUR, USD et autres devises.', accent: 'bg-zinc-700 text-white' },
                { icon: Smartphone, title: 'Mode hors-ligne / PWA', desc: 'Aucune installation nécessaire. Ajoutez-le à votre téléphone en un geste et utilisez-le comme une app native.', accent: 'bg-zinc-800 text-white' },
              ].map((f) => (
                <div
                  key={f.title}
                  className="group bg-white rounded-2xl p-6 lg:p-7 border border-zinc-200/80 hover:border-zinc-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className={cn('size-11 rounded-xl flex items-center justify-center mb-5', f.accent)}>
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tarifs */}
        <PricingSection />

        {/* Testimonial / Stats */}
        <section className="py-24 lg:py-28 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
              {[
                { value: '10k+', label: 'Transactions traitées' },
                { value: '500+', label: 'Commerces utilisateurs' },
                { value: '99.9%', label: 'Temps de disponibilité' },
                { value: '5★', label: 'Satisfaction client' },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl lg:text-3xl font-bold font-heading tracking-tight text-zinc-900 mb-1">{s.value}</div>
                  <div className="text-xs text-zinc-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-zinc-400">
              <span className="font-medium text-zinc-500">Présent dans :</span>
              {['Lomé', 'Abidjan', 'Dakar', 'Cotonou', 'Ouagadougou', 'Bamako', 'Niamey', 'Conakry', 'Accra', 'Lagos'].map((city) => (
                <span key={city} className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
                  {city}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 lg:py-28 px-6 bg-zinc-900">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-heading font-bold tracking-tight text-white mb-4">
              Prêt à développer votre commerce ?
            </h2>
            <p className="text-zinc-400 text-base lg:text-lg mb-8 max-w-xl mx-auto">
              Rejoignez des centaines de commerçants qui font confiance à StockOS Pro.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium bg-white text-zinc-900 rounded-xl hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              Commencer gratuitement
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 py-10 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Store className="size-4 text-white" />
            </div>
            <span className="text-sm font-heading font-bold">StockOS Pro</span>
          </div>
          <p className="text-xs text-zinc-400">© {new Date().getFullYear()} StockOS Pro. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
