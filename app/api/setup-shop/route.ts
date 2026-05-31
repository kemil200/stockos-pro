import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { shops, shopSettings, invoiceSettings, subscriptions, users } from '@/lib/db/schema';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  }

  const { name, slug, userId } = await request.json();

  if (user.id !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const shop = await db.transaction(async (tx) => {
    const [shop] = await tx
      .insert(shops)
      .values({ name, slug, userId })
      .returning();

    await tx.insert(shopSettings).values({ shopId: shop.id, legalName: shop.name, email: '', phone: '' });
    await tx.insert(invoiceSettings).values({ shopId: shop.id });
    await tx.insert(subscriptions).values({
      shopId: shop.id, plan: 'TRIAL', status: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const displayName = user.user_metadata?.name || user.email || 'Utilisateur';
    await tx.insert(users).values({
      authUserId: user.id, shopId: shop.id, role: 'owner', displayName, email: user.email || '',
    });

    return shop;
  });

  return NextResponse.json({ shop });
}
