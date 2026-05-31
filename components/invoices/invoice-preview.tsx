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
    enable_tax?: boolean;
    tax_rate?: string | null;
    enable_line_discount?: boolean;
    enable_global_discount?: boolean;
    enable_shipping?: boolean;
    enable_rounding?: boolean;
    rounding_precision?: string | null;
  };
  globalDiscountRate?: number;
  shippingFee?: number;
}

export function InvoicePreview({ lines, settings, globalDiscountRate = 0, shippingFee = 0 }: PreviewProps) {
  const calc = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

    const lineDiscounts = settings.enable_line_discount
      ? lines.reduce((s, l) => s + (l.discountRate ? l.quantity * l.unitPrice * l.discountRate : 0), 0)
      : 0;

    const netSubtotal = subtotal - lineDiscounts;

    const globalDiscount = settings.enable_global_discount && globalDiscountRate > 0
      ? netSubtotal * (globalDiscountRate / 100)
      : 0;

    const shipping = settings.enable_shipping ? shippingFee : 0;

    const taxBase = netSubtotal - globalDiscount + shipping;

    const taxAmount = settings.enable_tax && settings.tax_rate
      ? taxBase * parseFloat(settings.tax_rate)
      : 0;

    const beforeRounding = taxBase + taxAmount;
    const roundingPrecision = settings.rounding_precision ? parseInt(settings.rounding_precision) : 0;

    const roundingAdjustment = settings.enable_rounding && roundingPrecision > 0
      ? Math.round(beforeRounding / Math.pow(10, roundingPrecision)) * Math.pow(10, roundingPrecision) - beforeRounding
      : 0;

    const total = beforeRounding + roundingAdjustment;

    return { subtotal, lineDiscounts, globalDiscount, shipping, taxAmount, roundingAdjustment, total };
  }, [lines, settings, globalDiscountRate, shippingFee]);

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
      {calc.globalDiscount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Remise globale</span>
          <span className="text-red-600">-{formatCurrency(calc.globalDiscount)}</span>
        </div>
      )}
      {calc.shipping > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">Frais de port</span>
          <span>{formatCurrency(calc.shipping)}</span>
        </div>
      )}
      {settings.enable_tax && calc.taxAmount > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500">TVA</span>
          <span>{formatCurrency(calc.taxAmount)}</span>
        </div>
      )}
      {settings.enable_rounding && calc.roundingAdjustment !== 0 && (
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
