'use client';

import { FileText } from 'lucide-react';

export function DownloadPDF() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="print-hide inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-all shadow-sm active:scale-[0.98]"
    >
      <FileText className="size-4" />
      Télécharger le rapport
    </button>
  );
}
