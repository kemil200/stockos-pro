import type { Metadata } from 'next';
import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Conditions d\'utilisation',
  description: 'Conditions générales d\'utilisation de StockOS Pro — logiciel SaaS de gestion commerciale pour PME.',
  robots: { index: false, follow: false },
};

export default function TermsPage() {
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
        <h1 className="text-2xl font-heading font-bold tracking-tight mb-8">Conditions générales d&apos;utilisation</h1>
        <div className="prose prose-sm prose-zinc max-w-none space-y-6">
          <p><strong>Dernière mise à jour :</strong> Juin 2026</p>

          <h2 className="text-lg font-semibold mt-8">1. Acceptation</h2>
          <p>En utilisant StockOS Pro, vous acceptez les présentes conditions. Si vous n&apos;êtes pas d&apos;accord, veuillez ne pas utiliser le service.</p>

          <h2 className="text-lg font-semibold mt-8">2. Description du service</h2>
          <p>StockOS Pro est un logiciel SaaS de gestion commerciale incluant facturation, gestion de stock, caisse enregistreuse, rapports et impressions de tickets thermiques. Le service est accessible via navigateur web sur ordinateur et mobile (PWA).</p>

          <h2 className="text-lg font-semibold mt-8">3. Abonnement et paiement</h2>
          <p>Les plans sont facturés en FCFA (XOF). Les abonnements annuels sont prépayés. L&apos;essai gratuit de 30 jours ne nécessite aucun engagement. À la fin de l&apos;essai, l&apos;accès est suspendu jusqu&apos;à souscription d&apos;un plan payant.</p>

          <h2 className="text-lg font-semibold mt-8">4. Responsabilité</h2>
          <p>StockOS Pro s&apos;engage à fournir un service fiable et sécurisé. Nous ne pouvons être tenus responsables des pertes indirectes liées à l&apos;utilisation du service. Il incombe à l&apos;utilisateur de vérifier l&apos;exactitude des données saisies.</p>

          <h2 className="text-lg font-semibold mt-8">5. Résiliation</h2>
          <p>Vous pouvez annuler votre abonnement à tout moment. L&apos;accès reste actif jusqu&apos;à la fin de la période payée. StockOS Pro se réserve le droit de suspendre un compte en cas de violation des présentes conditions.</p>

          <h2 className="text-lg font-semibold mt-8">6. Propriété des données</h2>
          <p>Vous restez propriétaire de toutes les données saisies dans StockOS Pro. À la résiliation, vous pouvez exporter l&apos;intégralité de vos données avant leur suppression.</p>

          <h2 className="text-lg font-semibold mt-8">7. Modification des conditions</h2>
          <p>StockOS Pro se réserve le droit de modifier ces conditions. Les utilisateurs seront informés des changements par email avec un préavis de 30 jours.</p>

          <h2 className="text-lg font-semibold mt-8">8. Contact</h2>
          <p>Pour toute question juridique : contact@stockos.site.</p>
        </div>
      </main>
      <footer className="border-t py-8 px-6 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} StockOS Pro. Tous droits réservés.
      </footer>
    </div>
  );
}
