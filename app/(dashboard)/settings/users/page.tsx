import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { canWrite } from '@/lib/permissions';
import { notFound } from 'next/navigation';
import { Users, Shield } from 'lucide-react';
import { AssignRoleButton } from './assign-role-button';

export default async function UsersPage() {
  const { shop, permissions } = await getCurrentShop();
  if (!canWrite(permissions, 'settings')) notFound();

  const admin = createAdminClient();

  const [{ data: shopUsers }, { data: allRoles }] = await Promise.all([
    admin.from('users').select('*, roles(name, permissions)').eq('shop_id', shop.id).order('created_at'),
    admin.from('roles').select('id, name').eq('shop_id', shop.id).order('is_default'),
  ]);

  const users = shopUsers ?? [];
  const rolesList = allRoles ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-zinc-500 mt-1.5">{users.length} utilisateur(s)</p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
        <div className="divide-y">
          {users.map((u: any) => {
            const roleName = u.roles?.name || (u.role === 'owner' ? 'Propriétaire' : 'Employé');
            const perms = u.roles?.permissions as Record<string, string> | null;
            const writeCount = perms ? Object.values(perms).filter((v: string) => v === 'write').length : 0;

            return (
              <div key={u.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors">
                <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                  <Users className="size-4 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-900">{u.display_name}</p>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Shield className="size-3 text-zinc-400" />
                      <span className="text-sm font-medium text-zinc-700">{roleName}</span>
                    </div>
                    {writeCount > 0 && (
                      <p className="text-[10px] text-zinc-400">{writeCount} accès écriture</p>
                    )}
                  </div>
                  <AssignRoleButton
                    userId={u.id}
                    currentRoleId={u.role_id}
                    roles={rolesList}
                    userName={u.display_name}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
