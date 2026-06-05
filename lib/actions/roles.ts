'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { roles as rolesTable } from '@/lib/db/schema';
import { CreateRoleSchema, UpdateRoleSchema, AssignRoleSchema } from '@/lib/validations/role';
import { assertPermission } from '@/lib/permissions';
import { assertWritable } from '@/lib/readonly';
import { createAdminClient } from '@/lib/server';
import { eq, and } from 'drizzle-orm';

export async function createRole(formData: FormData) {
  try {
    const { shop, permissions } = await getCurrentShop();
    await assertWritable(shop.id);
    assertPermission(permissions, 'settings', 'write');

    const rawPerms = JSON.parse(formData.get('permissions') as string);
    const parsed = CreateRoleSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      permissions: rawPerms,
    });

    await db.insert(rolesTable).values({
      shopId: shop.id,
      name: parsed.name,
      description: parsed.description || null,
      permissions: parsed.permissions,
    });

    revalidatePath('/settings/roles');
    return { success: true } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function updateRole(formData: FormData) {
  try {
    const { shop, permissions } = await getCurrentShop();
    await assertWritable(shop.id);
    assertPermission(permissions, 'settings', 'write');

    const rawPerms = JSON.parse(formData.get('permissions') as string);
    const parsed = UpdateRoleSchema.parse({
      roleId: formData.get('roleId'),
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      permissions: rawPerms,
    });

    await db
      .update(rolesTable)
      .set({
        name: parsed.name,
        description: parsed.description || null,
        permissions: parsed.permissions,
        updatedAt: new Date(),
      })
      .where(and(eq(rolesTable.id, parsed.roleId), eq(rolesTable.shopId, shop.id)));

    revalidatePath('/settings/roles');
    revalidatePath(`/settings/roles/${parsed.roleId}`);
    return { success: true } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function deleteRole(roleId: string) {
  try {
    const { shop, permissions } = await getCurrentShop();
    await assertWritable(shop.id);
    assertPermission(permissions, 'settings', 'write');

    await db
      .delete(rolesTable)
      .where(and(eq(rolesTable.id, roleId), eq(rolesTable.shopId, shop.id), eq(rolesTable.isDefault, false)));

    revalidatePath('/settings/roles');
    return { success: true } as const;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}

export async function assignRoleToUser(formData: FormData) {
  try {
    const { shop, permissions } = await getCurrentShop();
    await assertWritable(shop.id);
    assertPermission(permissions, 'settings', 'write');

    const parsed = AssignRoleSchema.parse({
      userId: formData.get('userId'),
      roleId: formData.get('roleId') || null,
    });

    const admin = createAdminClient();
    const { error } = await admin
      .from('users')
      .update({ role_id: parsed.roleId })
      .eq('id', parsed.userId)
      .eq('shop_id', shop.id);

    if (error) return { success: false, error: error.message } as const;

    revalidatePath('/settings/users');
    return { success: true } as const;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues.map((e) => e.message).join(', ') } as const;
    }
    const message = err instanceof Error ? err.message : 'Erreur inattendue';
    return { success: false, error: message } as const;
  }
}
