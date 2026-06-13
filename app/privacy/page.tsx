import type { Metadata } from 'next';
import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité de StockOS Pro — protection des données des commerces en Afrique de l\'Ouest.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="px-6 h-14 flex items-center border-b bg-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-zinc-900 flex items-center justify-center shadow-sm">
            <Store className="size-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight">StockOS Pro</span>
        </Link>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-8">
          <ArrowLeft className="size-3.5" />
          Retour à l&apos;accueil
        </Link>
        <h1 className="text-2xl font-heading font-bold tracking-tight mb-8">Politique de confidentialité</h1>
        <div className="prose prose-sm prose-zinc max-w-none space-y-6">
          <p><strong>Dernière mise à jour :</strong> Juin 2026</p>

          <h2 className="text-lg font-semibold mt-8">1. Collecte des données</h2>
          <p>StockOS Pro collecte uniquement les données nécessaires au fonctionnement du service : nom du commerce, email, numéro de téléphone, et données de gestion commerciale (factures, stocks, paiements).</p>

          <h2 className="text-lg font-semibold mt-8">2. Utilisation des données</h2>
          <p>Vos données sont utilisées exclusivement pour vous fournir le service StockOS Pro : génération de factures, suivi de stock, rapports financiers et support client. Elles ne sont jamais vendues ni partagées avec des tiers.</p>

          <h2 className="text-lg font-semibold mt-8">3. Stockage et sécurité</h2>
          <p>Les données sont hébergées sur Supabase (infrastructure AWS en Europe) avec chiffrement en transit (TLS 1.3) et au repos (AES-256). Les accès sont protégés par Row-Level Security (RLS) garantissant l&apos;isolation stricte entre chaque commerce.</p>

          <h2 className="text-lg font-semibold mt-8">4. Conservation</h2>
          <p>Les données sont conservées tant que votre compte est actif. À la suppression de votre compte, toutes les données sont effacées définitivement sous 30 jours.</p>

          <h2 className="text-lg font-semibold mt-8">5. Vos droits</h2>
          <p>Conformément aux réglementations applicables, vous pouvez à tout moment : accéder à vos données, les rectifier, demander leur suppression, ou exporter l&apos;intégralité de vos données. Contactez-nous pour toute demande.</p>

          <h2 className="text-lg font-semibold mt-8">6. Cookies</h2>
          <p>StockOS Pro utilise uniquement des cookies techniques essentiels à l&apos;authentification (session Supabase). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.</p>

          <h2 className="text-lg font-semibold mt-8">7. Contact</h2>
          <p>Pour toute question relative à la confidentialité : contact@stockos.site.</p>
        </div>
      </main>
      <footer className="border-t py-8 px-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} StockOS Pro. Tous droits réservés.
      </footer>
    </div>
  );
}
