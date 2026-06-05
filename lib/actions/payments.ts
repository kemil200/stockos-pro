'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { db } from '@/lib/db';
import { invoices, payments, cashMovements } from '@/lib/db/schema';
import { revalidatePath } from 'next/cache';
import { PaymentSchema } from '@/lib/validations/invoice';
import { auditLog, AuditAction } from '@/lib/audit';
import { assertWritable } from '@/lib/readonly';

export async function recordPayment(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
    await assertWritable(shop.id);
    const admin = createAdminClient();

    const parsed = PaymentSchema.parse({
      invoiceId: formData.get('invoiceId'),
      amount: formData.get('amount'),
      method: formData.get('method'),
      reference: formData.get('reference') || undefined,
      notes: formData.get('notes') || undefined,
    });

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', parsed.invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (!invoice) return { success: false, error: 'Facture introuvable' } as const;
    if (!['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status)) {
      return { success: false, error: 'Cette facture ne peut pas recevoir de paiement' } as const;
    }

    const currentPaid = Number(invoice.amount_paid);
    const total = Number(invoice.total);
    const newPaid = currentPaid + parsed.amount;

    if (newPaid > total) {
      return { success: false, error: 'Le paiement dépasse le solde restant' } as const;
    }

    const newStatus = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

    let payment: { id: string } | null = null;

    await db.transaction(async (tx) => {
      const [created] = await tx
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

      payment = created;

      const updateData: Record<string, unknown> = {
        amountPaid: String(newPaid),
        balanceDue: String(total - newPaid),
        status: newStatus,
      };
      if (newStatus === 'PAID') {
        updateData.paidAt = new Date();
      }

      await tx
        .update(invoices)
        .set(updateData)
        .where(and(
          eq(invoices.id, parsed.invoiceId),
          eq(invoices.shopId, shop.id),
        ));

      await tx.insert(cashMovements).values({
        shopId: shop.id,
        movementType: 'PAYMENT_IN',
        amount: String(parsed.amount),
        referenceType: 'payment',
        referenceId: created.id,
        description: `Paiement facture ${invoice.invoice_number}`,
        createdBy: user.id,
      });
    });

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.PAYMENT_RECEIVED,
        entityType: 'payment',
        entityId: payment!.id,
        metadata: { amount: parsed.amount, method: parsed.method, invoiceId: parsed.invoiceId },
      });
    } catch (auditErr) {
      console.error('Audit log failed:', auditErr);
    }

    revalidatePath(`/invoices/${parsed.invoiceId}`);
    revalidatePath('/invoices');
    return { success: true, payment, status: newStatus } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
