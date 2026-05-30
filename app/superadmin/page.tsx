import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { shops, users } from '@/lib/db/schema';

export default async function SuperAdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const allShops = await db.select().from(shops);
  const allUsers = await db.select().from(users);

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Superadmin</h1>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-zinc-500">Boutiques</p>
            <p className="text-3xl font-bold">{allShops.length}</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-zinc-500">Utilisateurs</p>
            <p className="text-3xl font-bold">{allUsers.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-semibold mb-4">Boutiques</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Nom</th>
                <th className="pb-2 font-medium">Slug</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Créée le</th>
              </tr>
            </thead>
            <tbody>
              {allShops.map((shop) => (
                <tr key={shop.id} className="border-b last:border-0">
                  <td className="py-2">{shop.name}</td>
                  <td className="py-2 text-zinc-500">{shop.slug}</td>
                  <td className="py-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      {shop.status}
                    </span>
                  </td>
                  <td className="py-2 text-zinc-500">
                    {shop.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {allShops.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-zinc-400">Aucune boutique</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold mb-4">Utilisateurs</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Rôle</th>
                <th className="pb-2 font-medium">Boutique</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => {
                const shop = allShops.find((s) => s.id === u.shopId);
                return (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2 text-zinc-500">{shop?.name ?? '-'}</td>
                  </tr>
                );
              })}
              {allUsers.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-zinc-400">Aucun utilisateur</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
