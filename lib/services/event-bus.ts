import 'server-only';

import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

interface EventParams {
  shopId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  data: Record<string, unknown>;
  userId?: string | null;
}

export async function emitEvent(params: EventParams) {
  const [last] = await db
    .select({ version: events.version })
    .from(events)
    .where(and(
      eq(events.aggregateType, params.aggregateType),
      eq(events.aggregateId, params.aggregateId),
    ))
    .orderBy(desc(events.version))
    .limit(1);

  const version = (last?.version ?? 0) + 1;

  await db.insert(events).values({
    shopId: params.shopId,
    eventType: params.eventType,
    aggregateType: params.aggregateType,
    aggregateId: params.aggregateId,
    data: params.data,
    userId: params.userId as any,
    version,
  });
}
