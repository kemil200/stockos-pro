import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@/components/ui/sonner';
import { CookieBanner } from '@/components/cookie-banner';
import './globals.css';

const heading = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stockos.site'),
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  title: {
    default: 'StockOS Pro — Gestion commerciale, facturation et stock PME',
    template: '%s | StockOS Pro',
  },
  description:
    'Logiciel SaaS gestion commerciale pour PME Afrique de l\'Ouest. Facturation, stock, caisse enregistreuse et rapports. PWA sans installation. FCFA, EUR, USD.',
  keywords: [
    'logiciel gestion commerciale', 'facturation PME', 'gestion de stock',
    'caisse enregistreuse', 'ERP Afrique', 'SaaS PME', 'logiciel facturation',
    'Togo', 'Bénin', 'Côte d\'Ivoire', 'Sénégal', 'Guinée', 'FCFA',
    'gestion commerciale Afrique de l\'Ouest', 'stock management', 'PWA',
    'Lomé', 'Abidjan', 'Dakar', 'Cotonou', 'Ouagadougou', 'Bamako',
    'Niamey', 'Conakry', 'logiciel caisse Togo', 'ERP Bénin',
    'facturation Côte d\'Ivoire', 'gestion stock Sénégal',
  ],
  authors: [{ name: 'StockOS Pro' }],
  creator: 'StockOS Pro',
  publisher: 'StockOS Pro',
  formatDetection: { telephone: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'StockOS Pro',
    title: 'StockOS Pro — Gestion commerciale, facturation et stock pour PME en Afrique de l\'Ouest',
    description:
      'Solution SaaS complète pour les PME ouest-africaines. Facturez, gérez votre stock et votre caisse depuis n\'importe quel appareil, sans installation. Disponible au Togo, Bénin, Côte d\'Ivoire, Sénégal et plus.',
    url: '/',
    images: [
      {
        url: '/og',
        width: 1200,
        height: 630,
        alt: 'StockOS Pro — Gestion commerciale pour PME en Afrique de l\'Ouest',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StockOS Pro — Gestion commerciale SaaS pour PME ouest-africaines',
    description:
      'Facturation, stock, caisse. Accessible sans installation. Conçu pour les commerces au Togo, Bénin, Côte d\'Ivoire, Sénégal.',
    images: ['/og'],
  },
  alternates: {
    canonical: '/',
    languages: { fr: '/' },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'StockOS Pro',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'format-detection': 'telephone=no',
    'geo.region': 'TG-BJ-CI-SN-GN-ML-BF-NE-GH-NG',
    'geo.placename': 'Lomé, Abidjan, Dakar, Cotonou, Ouagadougou, Bamako, Niamey, Conakry, Accra, Lagos',
    'geo.position': '6.1725;1.2314',
    'ICBM': '6.1725, 1.2314',
    'DC.coverage': 'Afrique de l\'Ouest, West Africa, Togo, Bénin, Côte d\'Ivoire, Sénégal, Guinée, Mali, Burkina Faso, Niger, Ghana, Nigeria',
    'DC.language': 'fr',
    'DC.subject': 'Gestion commerciale, Facturation, Gestion de stock, Caisse enregistreuse, ERP, PME, SaaS, Afrique de l\'Ouest',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full font-body">
        {children}
        <Analytics />
        <Toaster position="top-right" richColors />
        <CookieBanner />
      </body>
    </html>
  );
}
