import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion — StockOS Pro',
  robots: { index: false, follow: false },
  alternates: { canonical: '/' },
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children;
}
