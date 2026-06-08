'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { assertWritable } from '@/lib/readonly';
import { assertPlanLimit } from '@/lib/plans';

export async function listUsers() {
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();
  const { data } = await admin
    .from('users')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function removeUser(userId: string) {
  const { shop, user } = await getCurrentShop();
  await assertWritable(shop.id);

  if (user.role !== 'owner') return { success: false, error: 'Réservé au propriétaire' } as const;

  if (user.id === userId) {
    return { success: false, error: 'Vous ne pouvez pas vous supprimer vous-même' } as const;
  }

  const admin = createAdminClient();
  const { data: target } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .eq('shop_id', shop.id)
    .single();

  if (!target) return { success: false, error: 'Utilisateur introuvable' } as const;
  if (target.role === 'owner') return { success: false, error: 'Impossible de supprimer le propriétaire' } as const;

  const { error } = await admin
    .from('users')
    .delete()
    .eq('id', userId)
    .eq('shop_id', shop.id);

  if (error) return { success: false, error: error.message } as const;

  revalidatePath('/settings/users');
  return { success: true } as const;
}

export async function inviteUserByEmail(email: string) {
  const { shop, user } = await getCurrentShop();
  await assertWritable(shop.id);

  if (user.role !== 'owner') return { success: false, error: 'Réservé au propriétaire' } as const;
  await assertPlanLimit(shop.id, 'maxUsers');

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('users')
    .select('id')
    .eq('shop_id', shop.id)
    .eq('email', email)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: false, error: 'Cet utilisateur est déjà membre' } as const;
  }

  const { data: authUsers } = await admin.auth.admin.listUsers();

  const authUser = authUsers.users.find((u: any) => u.email === email);

  if (authUser) {
    const { error } = await admin
      .from('users')
      .insert({
        shop_id: shop.id,
        auth_user_id: authUser.id,
        role: 'EMPLOYEE',
        display_name: authUser.user_metadata?.name || email,
        email,
      });

    if (error) return { success: false, error: error.message } as const;

    revalidatePath('/settings/users');
    return { success: true, message: `${email} ajouté avec succès` } as const;
  }

  return {
    success: false,
    error: `Aucun compte trouvé pour ${email}. Demandez-lui de créer un compte d'abord.`,
  } as const;
}
