import { Star, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const testimonials = [
  {
    name: 'Amivi K.',
    business: 'Boutique de cosmétiques',
    city: 'Lomé, Togo',
    text: 'Depuis que j\'utilise StockOS Pro, je suis mes ventes et mon stock sur mon téléphone sans effort. Je peux créer une facture en 30 secondes. J\'ai réduit mes pertes de stock de 40% en 3 mois.',
    result: '+40% de précision de stock en 3 mois',
  },
  {
    name: 'Koffi M.',
    business: 'Quincaillerie',
    city: 'Cotonou, Bénin',
    text: 'Avant, je perdais du temps avec des notes papier. Maintenant, je sais exactement combien j\'ai gagné chaque jour. Les tickets thermiques impressionnent mes clients. Je ne reviendrai pas en arrière.',
    result: 'Suivi quotidien des ventes',
  },
  {
    name: 'Fatou D.',
    business: 'Supermarché',
    city: 'Dakar, Sénégal',
    text: 'Avec 3 caissières, je voyais des écarts chaque semaine. StockOS Pro m\'a permis de tracer chaque vente. En 1 mois, les écarts de caisse ont disparu. Le support WhatsApp est très réactif.',
    result: '0 écart de caisse en 1 mois',
  },
  {
    name: 'Moussa T.',
    business: 'Boutique de téléphones',
    city: 'Ouagadougou, Burkina Faso',
    text: 'J\'ai 200 téléphones en stock, impossible de suivre sans outil. StockOS Pro m\'envoie une alerte quand un modèle passe sous 5 unités. Je ne rate plus aucune vente par rupture de stock.',
    result: 'Zéro rupture de stock',
  },
  {
    name: 'Aminata K.',
    business: 'Pharmacie',
    city: 'Abidjan, Côte d\'Ivoire',
    text: 'La gestion des dates de péremption est cruciale pour nous. Avec StockOS Pro, je peux suivre mes lots et prioriser les ventes. Le mode hors-ligne est parfait quand le réseau est instable.',
    result: 'Gestion des dates optimisée',
  },
];

const useCases = [
  {
    icon: Package,
    title: 'Boutiques et commerces de détail',
    desc: 'Gérez votre inventaire, imprimez des tickets pour chaque client et suivez vos ventes quotidiennes sans papier ni calculatrice.',
  },
  {
    icon: TrendingUp,
    title: 'Supermarchés et épiceries',
    desc: 'Plusieurs caisses, des centaines de produits, des marges serrées. Centralisez tout et voyez vos performances par rayon.',
  },
  {
    icon: Package,
    title: 'Grossistes et demi-grossistes',
    desc: 'Achetez en gros, vendez au détail. Suivez vos marges par produit et sachez exactement quand réapprovisionner.',
  },
];

export function TestimonialsSection() {
  return (
    <>
      {/* Testimonials */}
      <section className="py-24 lg:py-28 px-6 bg-zinc-50/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 block">Avis clients</span>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-heading font-bold tracking-tight mb-4">
              Ils font confiance à StockOS Pro
            </h2>
            <div className="flex items-center justify-center gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-sm text-zinc-500 ml-2">4.9 sur 5</span>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed flex-1 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-emerald-700 font-bold text-xs">{t.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.business} — {t.city}</p>
                    </div>
                  </div>
                  <p className="text-xs text-emerald-700 font-medium mt-2">{t.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 lg:py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 block">Cas d&apos;utilisation</span>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-heading font-bold tracking-tight mb-4">
              Pensé pour votre métier
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              StockOS Pro s&apos;adapte à votre secteur, pas l&apos;inverse.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {useCases.map((uc) => (
              <div key={uc.title} className="border border-zinc-200 rounded-2xl p-6 hover:border-zinc-300 hover:shadow-md transition-all">
                <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
                  <uc.icon className="size-5 text-zinc-600" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-2">{uc.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{uc.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/sign-up" className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]">
              Démarrer mon essai gratuit
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
