import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/server';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/sign-in');

  const admin = createAdminClient();
  const { data: shops } = await admin
    .from('shops')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (!shops?.length) redirect('/onboarding');

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
