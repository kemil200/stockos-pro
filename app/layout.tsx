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
  title: 'StockOS Pro',
  description: 'Gestion commerciale pour PME — Facturation, stock, caisse. Accessible sans installation.',
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
