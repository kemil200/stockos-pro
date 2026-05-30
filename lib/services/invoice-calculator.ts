import 'server-only';

interface LineInput {
  quantity: number;
  unitPrice: number;
  discountRate?: number;
}

interface InvoiceSettings {
  enableTax: boolean;
  taxRate: string | null;
  enableGlobalDiscount: boolean;
  enableLineDiscount: boolean;
  enableShipping: boolean;
  enableRounding: boolean;
  roundingPrecision: string | null;
}

interface LineDetail {
  lineSubtotal: number;
  discountAmount: number;
  lineTotal: number;
}

interface CalculationResult {
  lineDetails: LineDetail[];
  subtotal: number;
  lineDiscountTotal: number;
  netSubtotal: number;
  globalDiscount: number;
  shippingFee: number;
  taxBase: number;
  taxAmount: number;
  beforeRounding: number;
  roundingAdjustment: number;
  total: number;
}

function roundToNearest(value: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(value / factor) * factor;
}

export function calculateInvoice(
  lines: LineInput[],
  settings: InvoiceSettings,
  globalDiscountRate = 0,
  shippingFee = 0,
): CalculationResult {
  const lineDetails: LineDetail[] = lines.map((line) => {
    const lineSubtotal = line.quantity * line.unitPrice;
    const discountAmount = settings.enableLineDiscount && line.discountRate
      ? lineSubtotal * line.discountRate
      : 0;
    return {
      lineSubtotal,
      discountAmount,
      lineTotal: lineSubtotal - discountAmount,
    };
  });

  const subtotal = lineDetails.reduce((s, l) => s + l.lineSubtotal, 0);
  const lineDiscountTotal = lineDetails.reduce((s, l) => s + l.discountAmount, 0);
  const netSubtotal = subtotal - lineDiscountTotal;

  const globalDiscount = settings.enableGlobalDiscount && globalDiscountRate > 0
    ? netSubtotal * globalDiscountRate
    : 0;

  const shipping = settings.enableShipping ? shippingFee : 0;

  const taxBase = netSubtotal - globalDiscount + shipping;

  const taxAmount = settings.enableTax && settings.taxRate
    ? taxBase * parseFloat(settings.taxRate)
    : 0;

  const beforeRounding = taxBase + taxAmount;

  const roundingAdjustment = settings.enableRounding && settings.roundingPrecision
    ? roundToNearest(beforeRounding, parseInt(settings.roundingPrecision)) - beforeRounding
    : 0;

  const total = beforeRounding + roundingAdjustment;

  return {
    lineDetails,
    subtotal,
    lineDiscountTotal,
    netSubtotal,
    globalDiscount,
    shippingFee: shipping,
    taxBase,
    taxAmount,
    beforeRounding,
    roundingAdjustment,
    total,
  };
}
