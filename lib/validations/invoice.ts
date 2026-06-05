import { z } from 'zod';

export const InvoiceLineSchema = z.object({
  productId: z.string().uuid().optional(),
  packId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description requise'),
  quantity: z.coerce.number().positive('Quantité doit être positive'),
  unitPrice: z.coerce.number().min(0, 'Prix unitaire doit être ≥ 0'),
  discountRate: z.coerce.number().min(0).max(1).optional(),
});

export const CreateInvoiceSchema = z.object({
  clientName: z.string().min(1, 'Nom client requis'),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  lines: z.array(InvoiceLineSchema).min(1, 'Ajoutez au moins une ligne'),
  globalDiscountRate: z.coerce.number().min(0).max(1).optional(),
  shippingFee: z.coerce.number().min(0).optional(),
});

export const PaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce.number().positive('Montant doit être positif'),
  method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CARD', 'CHECK', 'OTHER']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;
