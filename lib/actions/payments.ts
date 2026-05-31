'use server';

import { z } from 'zod';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { PaymentSchema } from '@/lib/validations/invoice';
import { auditLog, AuditAction } from '@/lib/audit';

export async function recordPayment(formData: FormData) {
  try {
    const { shop, user } = await getCurrentShop();
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

    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .insert({
        shop_id: shop.id,
        invoice_id: parsed.invoiceId,
        amount: String(parsed.amount),
        method: parsed.method,
        reference: parsed.reference || null,
        notes: parsed.notes || null,
        received_by: user.id,
      })
      .select()
      .single();

    if (paymentError) return { success: false, error: `Erreur paiement: ${paymentError.message}` } as const;

    const newStatus = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

    const updateFields: Record<string, string> = {
      amount_paid: String(newPaid),
      balance_due: String(total - newPaid),
      status: newStatus,
    };
    if (newStatus === 'PAID') {
      updateFields.paid_at = new Date().toISOString();
    }

    const { error: updateError } = await admin
      .from('invoices')
      .update(updateFields)
      .eq('id', parsed.invoiceId);

    if (updateError) return { success: false, error: `Erreur mise à jour facture: ${updateError.message}` } as const;

    const { error: cashError } = await admin.from('cash_movements').insert({
      shop_id: shop.id,
      movement_type: 'PAYMENT_IN',
      amount: String(parsed.amount),
      reference_type: 'payment',
      reference_id: payment.id,
      description: `Paiement facture ${invoice.invoice_number}`,
      created_by: user.id,
    });

    if (cashError) {
      console.error(`Failed to record cash movement: ${cashError.message}`);
    }

    try {
      await auditLog({
        shopId: shop.id,
        userId: user.id,
        action: AuditAction.PAYMENT_RECEIVED,
        entityType: 'payment',
        entityId: payment.id,
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
