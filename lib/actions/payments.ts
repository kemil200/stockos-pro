'use server';

import { db } from '@/lib/db';
import { payments, invoices } from '@/lib/db/schema';
import { getCurrentShop } from '@/lib/tenant';
import { recordCashMovement } from '@/lib/services/cash-register';
import { emitEvent } from '@/lib/services/event-bus';
import { auditLog, AuditAction } from '@/lib/audit';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { PaymentSchema } from '@/lib/validations/invoice';

export async function recordPayment(formData: FormData) {
  const { shop, user } = await getCurrentShop();

  const parsed = PaymentSchema.parse({
    invoiceId: formData.get('invoiceId'),
    amount: formData.get('amount'),
    method: formData.get('method'),
    reference: formData.get('reference'),
    notes: formData.get('notes'),
  });

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(
      eq(invoices.id, parsed.invoiceId),
      eq(invoices.shopId, shop.id),
    ));

  if (!invoice) throw new Error('Facture introuvable');
  if (!['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status)) {
    throw new Error('Cette facture ne peut pas recevoir de paiement');
  }

  const currentPaid = Number(invoice.amountPaid);
  const total = Number(invoice.total);
  const newPaid = currentPaid + parsed.amount;

  if (newPaid > total) {
    throw new Error('Le paiement dépasse le solde restant');
  }

  const [payment] = await db
    .insert(payments)
    .values({
      shopId: shop.id,
      invoiceId: parsed.invoiceId,
      amount: String(parsed.amount),
      method: parsed.method,
      reference: parsed.reference || null,
      notes: parsed.notes || null,
      receivedBy: user.id,
    })
    .returning();

  const newStatus = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

  await db
    .update(invoices)
    .set({
      amountPaid: String(newPaid),
      balanceDue: String(total - newPaid),
      status: newStatus,
    })
    .where(eq(invoices.id, parsed.invoiceId));

  await recordCashMovement({
    shopId: shop.id,
    movementType: 'PAYMENT_IN',
    amount: parsed.amount,
    referenceType: 'payment',
    referenceId: payment.id,
    description: `Paiement facture ${invoice.invoiceNumber}`,
    createdBy: user.id,
  });

  await emitEvent({
    shopId: shop.id,
    eventType: 'PAYMENT_RECEIVED',
    aggregateType: 'payment',
    aggregateId: payment.id,
    data: {
      invoiceId: parsed.invoiceId,
      amount: parsed.amount,
      method: parsed.method,
      invoiceNumber: invoice.invoiceNumber,
    },
    userId: user.id,
  });

  await auditLog({
    shopId: shop.id,
    userId: user.id,
    action: AuditAction.PAYMENT_RECEIVED,
    entityType: 'payment',
    entityId: payment.id,
    metadata: {
      invoiceId: parsed.invoiceId,
      amount: parsed.amount,
      invoiceNumber: invoice.invoiceNumber,
    },
  });

  revalidatePath(`/invoices/${parsed.invoiceId}`);
  revalidatePath('/invoices');
  return { payment, status: newStatus };
}
