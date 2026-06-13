import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — StockOS Pro',
  description:
    'Connectez-vous à votre espace StockOS Pro. Gérez votre facturation, stock et caisse enregistreuse pour votre commerce au Togo, Bénin, Côte d\'Ivoire, Sénégal et Afrique de l\'Ouest.',
  robots: { index: true, follow: false },
  openGraph: {
    title: 'Connexion — StockOS Pro | Gestion commerciale Afrique de l\'Ouest',
    description:
      'Accédez à votre tableau de bord StockOS Pro. Facturation, stock, caisse — tout en un.',
  },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
