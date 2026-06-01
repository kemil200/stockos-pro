'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.98]"
    >
      <Printer className="size-4" />
      Imprimer le rapport
    </button>
  );
}
