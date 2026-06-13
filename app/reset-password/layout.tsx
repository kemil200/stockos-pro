import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouveau mot de passe — StockOS Pro',
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
