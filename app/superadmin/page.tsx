import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { shops, users } from '@/lib/db/schema';

export default async function SuperAdminPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const allShops = await db.select().from(shops);
  const allUsers = await db.select().from(users);

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Superadmin</h1>

        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4">Boutiques ({allShops.length})</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium">Slug</th>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {allShops.map((shop: { id: string; name: string; slug: string; userId: string | null }) => (
                  <tr key={shop.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{shop.name}</td>
                    <td className="px-4 py-3 text-zinc-500">{shop.slug}</td>
                    <td className="px-4 py-3 text-zinc-400 text-xs">{shop.userId || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Utilisateurs ({allUsers.length})</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-left px-4 py-3 font-medium">Rôle</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u: { id: string; displayName: string; email: string; role: string }) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{u.displayName}</td>
                    <td className="px-4 py-3 text-zinc-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-xs font-medium">{u.role}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
