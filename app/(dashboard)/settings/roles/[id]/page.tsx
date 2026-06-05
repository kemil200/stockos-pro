import { notFound } from 'next/navigation';
import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { canWrite } from '@/lib/permissions';
import { RoleForm } from '@/components/forms/role-form';

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { shop, permissions } = await getCurrentShop();
  if (!canWrite(permissions, 'settings')) notFound();

  const admin = createAdminClient();
  const { data: roleData } = await admin
    .from('roles')
    .select('*')
    .eq('id', id)
    .eq('shop_id', shop.id)
    .single();

  if (!roleData) notFound();

  return <RoleForm role={roleData} />;
}
