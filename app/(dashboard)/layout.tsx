import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { shops } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect('/sign-in');

  const orgId = session.session.activeOrganizationId;
  if (!orgId) redirect('/onboarding');

  const [shop] = await db.select().from(shops).where(eq(shops.clerkOrgId, orgId));
  if (!shop) redirect('/onboarding');

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
