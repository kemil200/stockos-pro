'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <div className="size-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-6 text-red-600" />
        </div>
        <h2 className="text-xl font-heading font-bold text-zinc-900 mb-2">Une erreur est survenue</h2>
        <p className="text-sm text-zinc-500 mb-6">
          {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all"
          >
            <RefreshCw className="size-4" />
            Réessayer
          </button>
          <Link
            href="/invoices"
            className="px-4 py-2 border rounded-xl text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Retour
          </Link>
        </div>
      </div>
    </div>
  );
}
