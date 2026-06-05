import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/server';
import { DEFAULT_ROLES } from '@/lib/permissions';

const MAX_BODY_SIZE = 4096;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non connecté' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }

  const origin = request.headers.get('origin') || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (appUrl && origin && origin !== appUrl) {
    return NextResponse.json({ error: 'Requête non autorisée' }, { status: 403 });
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Corps de requête trop volumineux' }, { status: 413 });
  }

  let body: { name?: string; slug?: string; userId?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 });
  }

  const { name, slug, userId } = body;

  if (!name || !slug || !userId) {
    return NextResponse.json({ error: 'Champs requis : name, slug, userId' }, { status: 400 });
  }

  if (user.id !== userId) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: existingShops } = await admin
    .from('shops')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  if (existingShops && existingShops.length > 0) {
    return NextResponse.json({ error: 'Une boutique existe déjà pour cet utilisateur' }, { status: 409 });
  }

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

  const defaultRoleIds: Record<string, string> = {};
  for (const def of DEFAULT_ROLES) {
    const { data: roleData, error: roleError } = await admin
      .from('roles')
      .insert({
        shop_id: shop.id, name: def.name, description: def.description,
        permissions: def.permissions, is_default: true,
      })
      .select('id')
      .single();

    if (!roleError && roleData) {
      defaultRoleIds[def.name] = roleData.id;
    }
  }

  const ownerRoleId = defaultRoleIds['Propriétaire'] || null;

  const { error: userError } = await admin
    .from('users')
    .insert({
      auth_user_id: user.id, shop_id: shop.id, role: 'owner',
      role_id: ownerRoleId,
      display_name: displayName, email: user.email || '',
    });

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ shop });
}
