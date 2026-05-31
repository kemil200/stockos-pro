import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  }

  const { name, slug, userId } = await request.json();

  if (user.id !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: shop, error: shopError } = await admin
    .from('shops')
    .insert({ name, slug, user_id: userId })
    .select()
    .single();

  if (shopError || !shop) {
    return NextResponse.json({ error: shopError?.message || 'Erreur création boutique' }, { status: 500 });
  }

  const displayName = user.user_metadata?.name || user.email || 'Utilisateur';

  const { error: settingsError } = await admin
    .from('shop_settings')
    .insert({ shop_id: shop.id, legal_name: shop.name, email: '', phone: '' });

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 });
  }

  const { error: invSettingsError } = await admin
    .from('invoice_settings')
    .insert({ shop_id: shop.id });

  if (invSettingsError) {
    return NextResponse.json({ error: invSettingsError.message }, { status: 500 });
  }

  const { error: subError } = await admin
    .from('subscriptions')
    .insert({
      shop_id: shop.id, plan: 'TRIAL', status: 'TRIAL',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  const { error: userError } = await admin
    .from('users')
    .insert({
      auth_user_id: user.id, shop_id: shop.id, role: 'owner', display_name: displayName, email: user.email || '',
    });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ shop });
}
