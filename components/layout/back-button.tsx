'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function BackButton({ href, label }: { href?: string; label?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors active:scale-95 lg:hidden"
      aria-label="Retour"
    >
      <ArrowLeft className="size-4" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
