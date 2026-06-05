'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function AutoPrint() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const thermal = searchParams.get('thermal');
    const print = searchParams.get('print');
    if (thermal === 'true') {
      setTimeout(() => window.print(), 600);
    } else if (print === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, [searchParams]);

  return null;
}
