import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte — StockOS Pro',
  description:
    'Créez votre compte StockOS Pro et commencez à gérer votre commerce. Facturation, gestion de stock, caisse enregistreuse pour PME en Afrique de l\'Ouest. Essai gratuit de 30 jours.',
  robots: { index: true, follow: false },
  openGraph: {
    title: 'Créer un compte — StockOS Pro | Logiciel gestion commerciale Afrique',
    description:
      'Inscrivez-vous gratuitement sur StockOS Pro. Solution SaaS pour PME au Togo, Bénin, Côte d\'Ivoire, Sénégal et toute l\'Afrique de l\'Ouest.',
  },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
