import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Toaster } from '@/components/ui/sonner';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://stockos-pro.vercel.app'),
  title: {
    default: 'StockOS Pro — Gestion commerciale, facturation et stock pour PME',
    template: '%s | StockOS Pro',
  },
  description:
    'Logiciel SaaS de gestion commerciale pour PME en Afrique de l\'Ouest. Facturation, gestion de stock, caisse enregistreuse, rapports. Accessible sans installation sur mobile (PWA). Multi-devises FCFA, EUR, USD.',
  keywords: [
    'logiciel gestion commerciale', 'facturation PME', 'gestion de stock',
    'caisse enregistreuse', 'ERP Afrique', 'SaaS PME', 'logiciel facturation',
    'Togo', 'Bénin', 'Côte d\'Ivoire', 'Sénégal', 'Guinée', 'FCFA',
    'gestion commerciale Afrique de l\'Ouest', 'stock management', 'PWA',
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
    title: 'StockOS Pro — Gestion commerciale, facturation et stock pour PME',
    description:
      'Solution SaaS complète pour les PME ouest-africaines. Facturez, gérez votre stock et votre caisse depuis n\'importe quel appareil, sans installation.',
    url: '/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StockOS Pro — Interface de gestion commerciale',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StockOS Pro — Gestion commerciale pour PME',
    description:
      'Facturation, stock, caisse. Accessible sans installation. Conçu pour l\'Afrique de l\'Ouest.',
    images: ['/og-image.png'],
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
      </body>
    </html>
  );
}
