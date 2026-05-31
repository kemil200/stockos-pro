const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string }> = {
  XOF: { symbol: 'FCFA', locale: 'fr-FR' },
  XAF: { symbol: 'FCFA', locale: 'fr-FR' },
  EUR: { symbol: '€', locale: 'fr-FR' },
  USD: { symbol: '$', locale: 'en-US' },
  GBP: { symbol: '£', locale: 'en-GB' },
  GNF: { symbol: 'FG', locale: 'fr-FR' },
};

export function formatCurrency(amount: number | string, currency = 'XOF'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.XOF;

  if (currency === 'XOF' || currency === 'XAF' || currency === 'GNF') {
    return `${Math.round(num).toLocaleString()} ${config.symbol}`;
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency,
  }).format(num);
}

export function marginRate(salePrice: number, purchasePrice: number): number | null {
  if (!purchasePrice) return null;
  return ((salePrice - purchasePrice) / purchasePrice) * 100;
}
