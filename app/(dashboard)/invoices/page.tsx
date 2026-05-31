import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
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
  const admin = createAdminClient();

  let query = admin
    .from('invoices')
    .select('*')
    .eq('shop_id', shop.id);

  if (status && status !== '') {
    query = query.eq('status', status);
  }

  const { data: allInvoices } = await query.order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">
            {allInvoices?.length ?? 0} facture{(allInvoices?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/invoices/new" className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors">
          <Plus className="size-4" />
          Nouvelle facture
        </Link>
      </div>

      <InvoiceFilters currentStatus={status} />
      <InvoiceTable invoices={allInvoices ?? []} />
    </div>
  );
}
