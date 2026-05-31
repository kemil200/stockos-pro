'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export function AutoPrint() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('print') === 'true') {
      setTimeout(() => window.print(), 500);
    }
  }, [searchParams]);

  return null;
}
