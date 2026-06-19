import 'server-only';

import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export enum AuditAction {
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_UPDATED = 'INVOICE_UPDATED',
  INVOICE_VALIDATED = 'INVOICE_VALIDATED',
  INVOICE_CANCELLED = 'INVOICE_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  STOCK_ADJUSTED = 'STOCK_ADJUSTED',
  CREDIT_NOTE_CREATED = 'CREDIT_NOTE_CREATED',
  SHOP_UPDATED = 'SHOP_UPDATED',
  USER_INVITED = 'USER_INVITED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  SUBSCRIPTION_UPDATED = 'SUBSCRIPTION_UPDATED',
  SHOP_DELETED = 'SHOP_DELETED',
}

interface AuditInput {
  shopId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function auditLog(input: AuditInput) {
  await db.insert(auditLogs).values({
    shopId: input.shopId,
    userId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId as any,
    metadata: input.metadata || {},
  });
}
