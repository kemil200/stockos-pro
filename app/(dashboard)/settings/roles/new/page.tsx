import { getCurrentShop } from '@/lib/tenant';
import { RoleForm } from '@/components/forms/role-form';
import { canWrite } from '@/lib/permissions';
import { notFound } from 'next/navigation';

export default async function NewRolePage() {
  const { permissions } = await getCurrentShop();
  if (!canWrite(permissions, 'settings')) notFound();

  return <RoleForm />;
}
