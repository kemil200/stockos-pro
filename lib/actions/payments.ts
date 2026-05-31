'use server';

import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { PaymentSchema } from '@/lib/validations/invoice';

export async function recordPayment(formData: FormData) {
  const { shop, user } = await getCurrentShop();
  const admin = createAdminClient();

  const parsed = PaymentSchema.parse({
    invoiceId: formData.get('invoiceId'),
    amount: formData.get('amount'),
    method: formData.get('method'),
    reference: formData.get('reference'),
    notes: formData.get('notes'),
  });

  const { data: invoice } = await admin
    .from('invoices')
    .select('*')
    .eq('id', parsed.invoiceId)
    .eq('shop_id', shop.id)
    .single();

  if (!invoice) throw new Error('Facture introuvable');
  if (!['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status)) {
    throw new Error('Cette facture ne peut pas recevoir de paiement');
  }

  const currentPaid = Number(invoice.amount_paid);
  const total = Number(invoice.total);
  const newPaid = currentPaid + parsed.amount;

  if (newPaid > total) {
    throw new Error('Le paiement dépasse le solde restant');
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

  if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`);

  const newStatus = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

  const { error: updateError } = await admin
    .from('invoices')
    .update({
      amount_paid: String(newPaid),
      balance_due: String(total - newPaid),
      status: newStatus,
    })
    .eq('id', parsed.invoiceId);

  if (updateError) throw new Error(`Failed to update invoice: ${updateError.message}`);

  await admin.from('cash_movements').insert({
    shop_id: shop.id,
    movement_type: 'PAYMENT_IN',
    amount: String(parsed.amount),
    reference_type: 'payment',
    reference_id: payment.id,
    description: `Paiement facture ${invoice.invoice_number}`,
    created_by: user.id,
  });

  revalidatePath(`/invoices/${parsed.invoiceId}`);
  revalidatePath('/invoices');
  return { payment, status: newStatus };
}
