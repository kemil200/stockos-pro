import { describe, it, expect } from 'vitest';
import { calculateInvoice } from '@/lib/services/invoice-calculator';
import { CreateInvoiceSchema, InvoiceLineSchema, PaymentSchema } from '@/lib/validations/invoice';
import { CreateProductSchema, AdjustStockSchema } from '@/lib/validations/product';

// ---------------------------------------------------------------------------
// 1. Calcul du total d'une facture
// ---------------------------------------------------------------------------

const TEST_UUID = '4061eb06-b2ee-4500-b4fa-51bc0ce692fc';

describe('Invoice Calculator', () => {
  const defaultSettings = {
    enableTax: false,
    taxRate: null,
    enableGlobalDiscount: false,
    enableLineDiscount: false,
    enableShipping: false,
    enableRounding: false,
    roundingPrecision: null,
  };

  it('calcule le sous-total correctement (sans remise, TVA, frais)', () => {
    const lines = [
      { quantity: 2, unitPrice: 5000 },  // 10 000
      { quantity: 1, unitPrice: 3000 },  //  3 000
    ];
    const result = calculateInvoice(lines, defaultSettings);
    expect(result.subtotal).toBe(13000);
    expect(result.total).toBe(13000);
  });

  it('applique une remise par ligne via discountRate', () => {
    const settings = { ...defaultSettings, enableLineDiscount: true };
    const lines = [
      { quantity: 1, unitPrice: 10000, discountRate: 0.1 }, // 10000 - 1000 = 9000
    ];
    const result = calculateInvoice(lines, settings);
    expect(result.lineDiscountTotal).toBe(1000);
    expect(result.total).toBe(9000);
  });

  it('applique une remise globale', () => {
    const settings = { ...defaultSettings, enableGlobalDiscount: true };
    const lines = [{ quantity: 1, unitPrice: 10000 }];
    const result = calculateInvoice(lines, settings, 0.05); // 5%
    expect(result.globalDiscount).toBe(500);
    expect(result.total).toBe(9500);
  });

  it('applique la TVA (ex: 18%)', () => {
    const settings = {
      ...defaultSettings,
      enableTax: true,
      taxRate: '0.18',
    };
    const lines = [{ quantity: 1, unitPrice: 10000 }];
    const result = calculateInvoice(lines, settings);
    expect(result.taxAmount).toBeCloseTo(1800);
    expect(result.total).toBeCloseTo(11800);
  });

  it('calcule avec remise ligne + remise globale + TVA + frais de port', () => {
    const settings = {
      enableTax: true,
      taxRate: '0.18',
      enableGlobalDiscount: true,
      enableLineDiscount: true,
      enableShipping: true,
      enableRounding: false,
      roundingPrecision: null,
    };
    const lines = [
      { quantity: 2, unitPrice: 5000, discountRate: 0.1 },   // 10 000 - 1 000 = 9 000
      { quantity: 1, unitPrice: 3000 },                       // 3 000
    ];
    // lineDiscountTotal = 1000, netSubtotal = 13000 - 1000 = 12000
    // globalDiscount = 12000 * 0.05 = 600
    // taxBase = 12000 - 600 + 2000 = 13400
    // taxAmount = 13400 * 0.18 = 2412
    // total = 13400 + 2412 = 15812
    const result = calculateInvoice(lines, settings, 0.05, 2000);
    expect(result.subtotal).toBe(13000);
    expect(result.lineDiscountTotal).toBe(1000);
    expect(result.globalDiscount).toBe(600);
    expect(result.shippingFee).toBe(2000);
    expect(result.taxBase).toBe(13400);
    expect(result.taxAmount).toBeCloseTo(2412);
    expect(result.total).toBeCloseTo(15812);
  });

  it('gère une facture sans lignes (cas limite)', () => {
    const result = calculateInvoice([], defaultSettings);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Validation Zod des schémas
// ---------------------------------------------------------------------------

describe('Zod Schemas', () => {
  describe('InvoiceLineSchema', () => {
    it('accepte une ligne valide', () => {
      const line = { description: 'Produit A', quantity: '2', unitPrice: '5000' };
      const result = InvoiceLineSchema.safeParse(line);
      expect(result.success).toBe(true);
    });

    it('rejette une quantité négative', () => {
      const result = InvoiceLineSchema.safeParse({
        description: 'X',
        quantity: '-1',
        unitPrice: '500',
      });
      expect(result.success).toBe(false);
    });

    it('rejette un prix unitaire négatif', () => {
      const result = InvoiceLineSchema.safeParse({
        description: 'X',
        quantity: '2',
        unitPrice: '-500',
      });
      expect(result.success).toBe(false);
    });

    it('rejette une description vide', () => {
      const result = InvoiceLineSchema.safeParse({
        description: '',
        quantity: '2',
        unitPrice: '500',
      });
      expect(result.success).toBe(false);
    });

    it('accepte un discountRate optionnel', () => {
      const line = {
        description: 'Produit B',
        quantity: '1',
        unitPrice: '10000',
        discountRate: '0.15',
      };
      const result = InvoiceLineSchema.safeParse(line);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.discountRate).toBe(0.15);
    });

    it('rejette un discountRate > 1', () => {
      const result = InvoiceLineSchema.safeParse({
        description: 'X',
        quantity: '1',
        unitPrice: '1000',
        discountRate: '1.5',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateInvoiceSchema', () => {
    it('accepte une facture valide', () => {
      const invoice = {
        clientName: 'Client Test',
        lines: [{ description: 'P1', quantity: '1', unitPrice: '1000' }],
      };
      const result = CreateInvoiceSchema.safeParse(invoice);
      expect(result.success).toBe(true);
    });

    it('rejette une facture sans client', () => {
      const result = CreateInvoiceSchema.safeParse({
        clientName: '',
        lines: [{ description: 'P1', quantity: '1', unitPrice: '1000' }],
      });
      expect(result.success).toBe(false);
    });

    it('rejette une facture sans lignes', () => {
      const result = CreateInvoiceSchema.safeParse({
        clientName: 'Client Test',
        lines: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('PaymentSchema', () => {
    it('accepte un paiement valide', () => {
      const payment = {
        invoiceId: TEST_UUID,
        amount: '5000',
        method: 'CASH',
      };
      const result = PaymentSchema.safeParse(payment);
      expect(result.success).toBe(true);
    });

    it('rejette un montant négatif', () => {
      const result = PaymentSchema.safeParse({
        invoiceId: TEST_UUID,
        amount: '-500',
        method: 'CASH',
      });
      expect(result.success).toBe(false);
    });

    it('rejette une méthode de paiement invalide', () => {
      const result = PaymentSchema.safeParse({
        invoiceId: TEST_UUID,
        amount: '5000',
        method: 'BITCOIN',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateProductSchema', () => {
    it('accepte un produit valide', () => {
      const product = {
        name: 'Sac de riz',
        unitPrice: '15000',
        unitType: 'UNITY',
      };
      const result = CreateProductSchema.safeParse(product);
      expect(result.success).toBe(true);
    });

    it('rejette un prix négatif', () => {
      const result = CreateProductSchema.safeParse({
        name: 'X',
        unitPrice: '-100',
        unitType: 'UNITY',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AdjustStockSchema', () => {
    it('accepte un ajustement valide', () => {
      const adjustment = {
        productId: TEST_UUID,
        newQuantity: '50',
      };
      const result = AdjustStockSchema.safeParse(adjustment);
      expect(result.success).toBe(true);
    });

    it('rejette une quantité négative', () => {
      const result = AdjustStockSchema.safeParse({
        productId: TEST_UUID,
        newQuantity: '-5',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// 3. Logique de déduction de stock
// ---------------------------------------------------------------------------

function tryDeductStock(currentQuantity: number, requested: number): {
  success: boolean;
  newQuantity: number;
  error?: string;
} {
  if (requested <= 0) return { success: false, newQuantity: currentQuantity, error: 'Quantité demandée invalide' };
  if (requested > currentQuantity) return { success: false, newQuantity: currentQuantity, error: 'Stock insuffisant' };
  return { success: true, newQuantity: currentQuantity - requested };
}

describe('Stock Deduction Logic', () => {
  it('déduit le stock quand la quantité est suffisante', () => {
    const result = tryDeductStock(100, 30);
    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(70);
  });

  it('refuse la déduction quand le stock est insuffisant', () => {
    const result = tryDeductStock(10, 30);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Stock insuffisant');
  });

  it('refuse une quantité demandée nulle ou négative', () => {
    const result = tryDeductStock(100, 0);
    expect(result.success).toBe(false);
  });

  it('déduit la totalité du stock', () => {
    const result = tryDeductStock(50, 50);
    expect(result.success).toBe(true);
    expect(result.newQuantity).toBe(0);
  });

  it('déduit le stock avec des décimales', () => {
    const result = tryDeductStock(10.5, 3.2);
    expect(result.success).toBe(true);
    expect(result.newQuantity).toBeCloseTo(7.3);
  });
});
