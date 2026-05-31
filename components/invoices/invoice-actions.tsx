'use client';

import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile('share' in navigator);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Facture',
          text: `Facture ${invoiceId}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      handlePrint();
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="gap-1.5"
      >
        <Download className="size-3.5" />
        Télécharger
      </Button>
      {isMobile && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleShare}
          className="gap-1.5"
        >
          <Share2 className="size-3.5" />
          Partager
        </Button>
      )}
    </div>
  );
}
