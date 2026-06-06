'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

const PLANS = [
  {
    name: 'Starter',
    desc: 'Pour démarrer votre activité',
    monthly: 5000,
    annual: 55000,
    features: [
      'Jusqu\'à 200 factures / mois',
      'Gestion de stock basique',
      'Catalogue produits (100 max)',
      'Rapports mensuels',
      '1 utilisateur',
    ],
    highlight: false,
  },
  {
    name: 'Essential',
    desc: 'Pour les commerces établis',
    monthly: 8500,
    annual: 90000,
    features: [
      'Facturation illimitée',
      'Gestion de stock avancée',
      'Packs de produits',
      'Caisse enregistreuse',
      'Rapports détaillés + graphiques',
      'Impression ticket thermique',
      'Support prioritaire',
    ],
    highlight: true,
  },
  {
    name: 'Business',
    desc: 'Pour les équipes et franchises',
    monthly: 13000,
    annual: 120000,
    features: [
      'Tout Essential inclus',
      'Multi-utilisateurs',
      'Rôles et permissions',
      'Plusieurs caisses',
      'Rapports avancés par point de vente',
      'API et exports',
      'Support dédié WhatsApp',
    ],
    highlight: false,
  },
];

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="py-24 lg:py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 lg:mb-16">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-4 block">Tarifs</span>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-heading font-bold tracking-tight mb-4">
            Choisissez votre offre
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto text-base lg:text-lg">
            Sans engagement. Passez au plan supérieur à tout moment.
          </p>

          <div className="inline-flex items-center gap-2 mt-8 bg-zinc-100 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                !annual ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                annual ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Annuel
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                -10%
              </span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            const perLabel = annual ? '/an' : '/mois';
            const monthlyEquivalent = annual ? Math.round(plan.annual / 12) : plan.monthly;

            return (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 lg:p-8 flex flex-col transition-all duration-200 ${
                  plan.highlight
                    ? 'border-emerald-300 bg-white shadow-lg lg:scale-105 relative'
                    : 'border-zinc-200/80 bg-white shadow-sm hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold shadow-sm">
                      <Sparkles className="size-3" />
                      Recommandé
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-heading font-bold text-zinc-900">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl lg:text-4xl font-bold font-heading tracking-tight text-zinc-900">
                      {new Intl.NumberFormat('fr-FR').format(price)}
                    </span>
                    <span className="text-lg text-zinc-500 font-medium">FCFA</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1 font-medium">
                    {perLabel} {annual ? `(${new Intl.NumberFormat('fr-FR').format(monthlyEquivalent)} FCFA/mois)` : ''}
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-600">
                      <Check className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/sign-up"
                  className={`inline-flex items-center justify-center gap-2 w-full px-6 py-3 text-sm font-medium rounded-xl transition-all shadow-sm active:scale-[0.98] ${
                    plan.highlight
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md'
                      : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                  }`}
                >
                  Commencer l&apos;essai gratuit
                  <ArrowRight className="size-4" />
                </Link>

                <p className="text-xs text-zinc-400 text-center mt-4">30 jours d&apos;essai gratuit</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-zinc-500">
            Contactez-nous au{' '}
            <a
              href="https://wa.me/22892294858"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-900 font-semibold hover:underline underline-offset-2"
            >
              +228 92 29 48 58
            </a>
            {' '}pour toute question
          </p>
        </div>
      </div>
    </section>
  );
}
