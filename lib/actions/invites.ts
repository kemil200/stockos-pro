'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { assertWritable } from '@/lib/readonly';
import { assertPlanLimit } from '@/lib/plans';
import { randomUUID } from 'crypto';

export async function createInvite() {
  const { shop, user } = await getCurrentShop();
  await assertWritable(shop.id);
  await assertPlanLimit(shop.id, 'maxUsers');

  if (user.role !== 'owner') {
    return { success: false, error: 'Réservé au propriétaire' } as const;
  }

  const admin = createAdminClient();
  const code = randomUUID().split('-')[0].substring(0, 8);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await admin.from('invites').insert({
    shop_id: shop.id,
    code,
    created_by: user.id,
    expires_at: expiresAt,
  });

  if (error) return { success: false, error: error.message } as const;

  revalidatePath('/settings/users');
  return { success: true, code, expiresAt } as const;
}

export async function acceptInvite(code: string) {
  const admin = createAdminClient();

  const { data: invites } = await admin
    .from('invites')
    .select('*, shops(name)')
    .eq('code', code)
    .is('used_at', null)
    .limit(1);

  const invite = invites?.[0] ?? null;
  if (!invite) return { success: false, error: 'Lien invalide ou déjà utilisé' } as const;
  if (new Date(invite.expires_at) < new Date()) {
    return { success: false, error: 'Ce lien a expiré' } as const;
  }

  return { success: true, shopId: invite.shop_id, shopName: invite.shops?.name || '' } as const;
}

export async function completeInvite(code: string, userId: string, displayName: string, email: string) {
  const admin = createAdminClient();

  const { data: existingUser } = await admin
    .from('users')
    .select('id, shop_id')
    .eq('auth_user_id', userId)
    .limit(1);

  if (existingUser && existingUser.length > 0) {
    return { success: false, error: 'Ce compte est déjà lié à une boutique' } as const;
  }

  const { data: updated, error: updateError } = await admin
    .from('invites')
    .update({ used_at: new Date().toISOString(), used_by: userId })
    .eq('code', code)
    .is('used_at', null)
    .select('shop_id')
    .single();

  if (updateError || !updated) {
    return { success: false, error: 'Lien invalide, déjà utilisé ou expiré' } as const;
  }

  const { data: invite } = await admin
    .from('invites')
    .select('expires_at')
    .eq('code', code)
    .single();

  if (invite && new Date(invite.expires_at) < new Date()) {
    return { success: false, error: 'Ce lien a expiré' } as const;
  }

  const { error: userError } = await admin.from('users').insert({
    auth_user_id: userId,
    shop_id: updated.shop_id,
    role: 'EMPLOYEE',
    display_name: displayName,
    email,
  });

  if (userError) {
    return { success: false, error: userError.message.includes('unique') ? 'Ce compte est déjà lié à une boutique' : userError.message } as const;
  }

  return { success: true, shopId: updated.shop_id } as const;
}

export async function deleteInvite(inviteId: string) {
  const { shop, user } = await getCurrentShop();
  if (user.role !== 'owner') return { success: false, error: 'Réservé au propriétaire' } as const;

  const admin = createAdminClient();
  const { error } = await admin.from('invites').delete().eq('id', inviteId).eq('shop_id', shop.id);
  if (error) return { success: false, error: error.message } as const;

  revalidatePath('/settings/users');
  return { success: true } as const;
}
