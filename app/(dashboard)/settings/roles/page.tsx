import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { canWrite } from '@/lib/permissions';
import Link from 'next/link';
import { Plus, Shield, Lock } from 'lucide-react';
import { notFound } from 'next/navigation';

function countPermissions(perms: Record<string, string>, level: string) {
  return Object.values(perms).filter((v) => v === level).length;
}

export default async function RolesPage() {
  const { shop, permissions } = await getCurrentShop();
  if (!canWrite(permissions, 'settings')) notFound();

  const admin = createAdminClient();
  const { data: allRoles } = await admin
    .from('roles')
    .select('*')
    .eq('shop_id', shop.id)
    .order('is_default', { ascending: false })
    .order('name');

  const rolesList = allRoles ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Rôles</h1>
          <p className="text-sm text-zinc-500 mt-1.5">{rolesList.length} rôle(s)</p>
        </div>
        <Link href="/settings/roles/new" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm">
          <Plus className="size-4" />
          Nouveau
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rolesList.map((role: any) => {
          const perms = role.permissions as Record<string, string>;
          const writeCount = countPermissions(perms, 'write');
          const readCount = countPermissions(perms, 'read');

          return (
            <Link
              key={role.id}
              href={`/settings/roles/${role.id}`}
              className="bg-white rounded-2xl border border-zinc-200/80 p-5 hover:border-zinc-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`size-10 rounded-xl flex items-center justify-center ${role.is_default ? 'bg-amber-100' : 'bg-zinc-100'}`}>
                  {role.is_default ? <Lock className="size-4 text-amber-600" /> : <Shield className="size-4 text-zinc-600" />}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">{role.name}</h3>
                  {role.description && <p className="text-xs text-zinc-500">{role.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {writeCount > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">{writeCount} écriture</span>
                )}
                {readCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-medium">{readCount} lecture</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
