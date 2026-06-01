import 'server-only';

import { createAdminClient } from '@/lib/server';

export class ReadOnlyError extends Error {
  constructor(message = 'Cette boutique est en lecture seule. Contactez le support.') {
    super(message);
    this.name = 'ReadOnlyError';
  }
}

export async function assertWritable(shopId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: subs } = await admin
    .from('subscriptions')
    .select('status, features')
    .eq('shop_id', shopId)
    .limit(1);

  const status = subs?.[0]?.status;
  const features = (subs?.[0]?.features ?? {}) as Record<string, unknown>;

  if (status === 'EXPIRED' || status === 'SUSPENDED' || !!features.readOnly) {
    throw new ReadOnlyError();
  }
}
