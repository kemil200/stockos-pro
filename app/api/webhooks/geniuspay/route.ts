import { createHmac, timingSafeEqual } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { createAdminClient } from '@/lib/server';
import { invoices, payments, cashMovements } from '@/lib/db/schema';
import { geniuspayTransactions } from '@/lib/db/schema/geniuspay';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
  } catch {
    return false;
  }
}

function verifySignature(
  signature: string,
  rawBody: string,
  timestamp: string,
  secret: string,
): boolean {
  const payload = JSON.parse(rawBody);
  const data = `${timestamp}.${JSON.stringify(payload)}`;
  const expected = createHmac('sha256', secret).update(data, 'utf-8').digest('hex');
  return safeCompare(signature, expected);
}

const TIMESTAMP_TOLERANCE = 300;

const FIVE_SECONDS = 5000;

function methodToInternal(paymentMethod: string, provider: string): string {
  if (paymentMethod === 'mobile_money') return 'MOBILE_MONEY';
  if (paymentMethod === 'card') return 'CARD';
  if (provider === 'wave' || provider === 'orange_money' || provider === 'mtn_money') return 'MOBILE_MONEY';
  return 'OTHER';
}

function buildError(status: number, title: string, detail: string) {
  return Response.json(
    { type: 'about:blank', title, status, detail, instance: '/webhooks/geniuspay' },
    { status },
  );
}

export async function POST(req: Request) {
  const startedAt = Date.now();

  try {
    const signature = req.headers.get('x-webhook-signature') || '';
    const timestamp = req.headers.get('x-webhook-timestamp') || '';
    const eventType = req.headers.get('x-webhook-event') || '';
    const deliveryId = req.headers.get('x-webhook-delivery') || '';
    const environment = req.headers.get('x-webhook-environment') || 'sandbox';

    if (!signature || !timestamp || !eventType) {
      return buildError(400, 'Bad Request', 'Required header is not present.');
    }

    const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
    if (!secret) {
      return buildError(500, 'Server Error', 'Webhook secret not configured.');
    }

    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - Number(timestamp));
    if (timeDiff > TIMESTAMP_TOLERANCE) {
      return buildError(400, 'Bad Request', 'Timestamp too old.');
    }

    const rawBody = await req.text();

    if (!verifySignature(signature, rawBody, timestamp, secret)) {
      return buildError(401, 'Unauthorized', 'Invalid signature.');
    }

    const event = JSON.parse(rawBody);

    switch (eventType) {
      case 'webhook.test':
        return Response.json({ success: true, message: 'Webhook test received' });

      case 'payment.success': {
        const data = event.data;
        if (!data) {
          return buildError(400, 'Bad Request', 'Missing event data.');
        }

        const gpReference = data.reference;
        const invoiceId = data.metadata?.invoice_id;

        if (!gpReference || !invoiceId) {
          return buildError(400, 'Bad Request', 'Missing reference or invoice_id.');
        }

        const admin = createAdminClient();

        const { data: invoice } = await admin
          .from('invoices')
          .select('id, shop_id, status, amount_paid, total')
          .eq('id', invoiceId)
          .single();

        if (!invoice) {
          return buildError(404, 'Not Found', 'Invoice not found.');
        }

        const shopId = invoice.shop_id;

        const { data: shop } = await admin
          .from('shops')
          .select('user_id')
          .eq('id', shopId)
          .single();

        const userId = shop?.user_id;
        if (!userId) {
          return buildError(404, 'Not Found', 'Shop not found.');
        }

        if (!['VALIDATED', 'PARTIALLY_PAID'].includes(invoice.status)) {
          return buildError(400, 'Bad Request', 'Invalid invoice status.');
        }

        const amount = Number(data.amount);
        const gpMethod = data.payment_method || '';
        const provider = data.provider || '';
        const method = methodToInternal(gpMethod, provider);

        const { data: existingRows } = await admin
          .from('geniuspay_transactions')
          .select('id, status')
          .eq('shop_id', shopId)
          .eq('gp_reference', gpReference)
          .limit(1);

        if (existingRows && existingRows.length > 0 && existingRows[0].status === 'completed') {
          return Response.json({ success: true, message: 'Already processed.' });
        }

        let paymentId: string | null = null;

        await db.transaction(async (tx) => {
          const [lockedInvoice] = await tx
            .select({
              amountPaid: invoices.amountPaid,
              total: invoices.total,
              status: invoices.status,
            })
            .from(invoices)
            .where(and(eq(invoices.id, invoiceId), eq(invoices.shopId, shopId)))
            .for('update');

          if (!lockedInvoice) throw new Error('Invoice not found.');
          if (!['VALIDATED', 'PARTIALLY_PAID'].includes(lockedInvoice.status)) {
            throw new Error('Invalid invoice status.');
          }

          const currentPaid = Number(lockedInvoice.amountPaid);
          const total = Number(lockedInvoice.total);
          const newPaid = currentPaid + amount;
          const newStatus = newPaid >= total ? 'PAID' : 'PARTIALLY_PAID';

          const [created] = await tx
            .insert(payments)
            .values({
              shopId,
              invoiceId,
              amount: String(amount),
              method,
              reference: gpReference,
              notes: `GeniusPay · ${provider || gpMethod}`,
              receivedBy: userId,
            })
            .returning();

          paymentId = created.id;

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
            .where(and(eq(invoices.id, invoiceId), eq(invoices.shopId, shopId)));

          await tx.insert(cashMovements).values({
            shopId,
            movementType: 'PAYMENT_IN',
            amount: String(amount),
            referenceType: 'payment',
            referenceId: created.id,
            description: `GeniusPay · ${provider || gpMethod}`,
            createdBy: userId,
          });

          const [existing] = await tx
            .select({ id: geniuspayTransactions.id })
            .from(geniuspayTransactions)
            .where(and(
              eq(geniuspayTransactions.shopId, shopId),
              eq(geniuspayTransactions.gpReference, gpReference),
            ))
            .limit(1);

          if (existing) {
            await tx
              .update(geniuspayTransactions)
              .set({ status: 'completed', paymentId: created.id, updatedAt: new Date() })
              .where(eq(geniuspayTransactions.id, existing.id));
          } else {
            await tx.insert(geniuspayTransactions).values({
              shopId,
              invoiceId,
              amount: String(amount),
              fees: data.fees ? String(data.fees) : null,
              netAmount: data.net_amount ? String(data.net_amount) : null,
              currency: data.currency || 'XOF',
              status: 'completed',
              gpReference,
              gpPaymentMethod: provider || gpMethod,
              paymentId: created.id,
              metadata: JSON.stringify(data.metadata || {}),
            });
          }
        });

        return Response.json({ success: true, payment_id: paymentId });
      }

      case 'payment.failed':
        return Response.json({ success: true, message: 'Payment failure recorded.' });

      case 'payment.cancelled':
        return Response.json({ success: true, message: 'Payment cancellation recorded.' });

      case 'payment.refunded':
        return Response.json({ success: true, message: 'Payment refund recorded.' });

      case 'payment.expired':
        return Response.json({ success: true, message: 'Payment expiration recorded.' });

      default:
        return Response.json({ success: true, message: `Unhandled event: ${eventType}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    if (Date.now() - startedAt > FIVE_SECONDS) {
      return buildError(500, 'Server Error', message);
    }
    return buildError(500, 'Server Error', message);
  }
}
