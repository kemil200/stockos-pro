import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { hasFeature } from '@/lib/plans';
import { notFound } from 'next/navigation';
import { Users, Shield, UserPlus, Trash2 } from 'lucide-react';
import { InviteForm } from './invite-form';
import { RemoveButton } from './remove-button';

export default async function UsersPage() {
  const { shop } = await getCurrentShop();
  const hasBusinessAccess = await hasFeature(shop.id, 'apiAccess');
  if (!hasBusinessAccess) notFound();

  const admin = createAdminClient();
  const { data: shopUsers } = await admin
    .from('users')
    .select('*')
    .eq('shop_id', shop.id)
    .order('created_at', { ascending: true });

  const users = shopUsers ?? [];
  const owner = users.find((u: any) => u.role === 'owner');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold tracking-tight">Utilisateurs</h1>
        <p className="text-sm text-zinc-500 mt-1.5">{users.length} utilisateur(s)</p>
      </div>

      <InviteForm />

      <div className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden">
        <div className="divide-y">
          {users.map((u: any) => (
            <div key={u.id} className="px-5 py-4 flex items-center gap-4 hover:bg-zinc-50/50 transition-colors">
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                u.role === 'owner' ? 'bg-amber-100' : 'bg-zinc-100'
              }`}>
                {u.role === 'owner' ? (
                  <Shield className="size-4 text-amber-600" />
                ) : (
                  <Users className="size-4 text-zinc-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-zinc-900">{u.display_name}</p>
                  {u.role === 'owner' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold">
                      Propriétaire
                    </span>
                  )}
                  {u.role === 'EMPLOYEE' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-100 text-zinc-500 rounded-full font-semibold">
                      Employé
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">
                  Inscrit le {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {u.role !== 'owner' && (
                <RemoveButton userId={u.id} userName={u.display_name} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
