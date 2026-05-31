import { getCurrentShop } from '@/lib/tenant';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';
export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status } = await searchParams;
  const { shop } = await getCurrentShop();

  const conditions = [eq(invoices.shopId, shop.id)];
  if (status && status !== '') {
    conditions.push(eq(invoices.status, status));
  }

  const allInvoices = await db
    .select()
    .from(invoices)
    .where(and(...conditions))
    .orderBy(desc(invoices.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">
            {allInvoices.length} facture{allInvoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/invoices/new" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
          <Plus className="size-4" />
          Nouvelle facture
        </Link>
      </div>

      <InvoiceFilters currentStatus={status} />
      <InvoiceTable invoices={allInvoices} />
    </div>
  );
}
