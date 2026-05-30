'use client';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/utils/currency';

interface PreviewLine {
  quantity: number;
  unitPrice: number;
  discountRate?: number;
}

interface PreviewProps {
  lines: PreviewLine[];
  settings: {
    enableTax?: boolean;
    taxRate?: string | null;
    enableLineDiscount?: boolean;
    enableGlobalDiscount?: boolean;
    enableShipping?: boolean;
    enableRounding?: boolean;
    roundingPrecision?: string | null;
  };
}

export function InvoicePreview({ lines, settings }: PreviewProps) {
  const calc = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

    const lineDiscounts = settings.enableLineDiscount
      ? lines.reduce((s, l) => s + (l.discountRate ? l.quantity * l.unitPrice * l.discountRate : 0), 0)
      : 0;

    const netSubtotal = subtotal - lineDiscounts;
    const taxBase = netSubtotal;

    const taxAmount = settings.enableTax && settings.taxRate
      ? taxBase * parseFloat(settings.taxRate)
      : 0;

    const beforeRounding = taxBase + taxAmount;
    const roundingPrecision = settings.roundingPrecision ? parseInt(settings.roundingPrecision) : 0;

    const roundingAdjustment = settings.enableRounding && roundingPrecision > 0
      ? Math.round(beforeRounding / Math.pow(10, roundingPrecision)) * Math.pow(10, roundingPrecision) - beforeRounding
      : 0;

    const total = beforeRounding + roundingAdjustment;

    return { subtotal, lineDiscounts, taxAmount, roundingAdjustment, total };
  }, [lines, settings]);

  if (lines.length === 0 || lines.every((l) => !l.quantity || !l.unitPrice)) {
    return null;
  }

  return (
    <div className="border rounded-lg p-4 space-y-2 bg-zinc-50">
      <h3 className="text-sm font-semibold text-zinc-700 mb-3">Aperçu</h3>
      <div className="flex justify-between text-sm">
        <span className="text-zinc-500">Sous-total</span>
        <span>{formatCurrency(calc.subtotal)}</span>
      </div>
      {calc.lineDiscounts > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Rabais</span>
          <span className="text-red-600">-{formatCurrency(calc.lineDiscounts)}</span>
        </div>
      )}
      {settings.enableTax && calc.taxAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">TVA</span>
          <span>{formatCurrency(calc.taxAmount)}</span>
        </div>
      )}
      {settings.enableRounding && calc.roundingAdjustment !== 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Arrondi</span>
          <span>{formatCurrency(calc.roundingAdjustment)}</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-base pt-2 border-t">
        <span>Total</span>
        <span>{formatCurrency(calc.total)}</span>
      </div>
    </div>
  );
}
