import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Créer un compte — StockOS Pro',
  robots: { index: false, follow: false },
  alternates: { canonical: '/' },
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return children;
}
