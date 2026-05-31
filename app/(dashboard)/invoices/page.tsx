import { getCurrentShop } from '@/lib/tenant';
import { createAdminClient } from '@/lib/server';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';
import { InvoiceTable } from '@/components/invoices/invoice-table';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const PAGE_SIZE = 50;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const { shop } = await getCurrentShop();
  const admin = createAdminClient();

  let query = admin
    .from('invoices')
    .select('*', { count: 'exact', head: false })
    .eq('shop_id', shop.id);

  if (status && status !== '') {
    query = query.eq('status', status);
  }

  if (q && q.trim() !== '') {
    query = query.or(`client_name.ilike.%${q}%,invoice_number.ilike.%${q}%`);
  }

  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: allInvoices, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)
    .limit(PAGE_SIZE);

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Factures</h1>
          <p className="text-sm text-muted-foreground">
            {count ?? 0} facture{(count ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/invoices/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all shadow-sm">
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nouvelle facture</span>
          <span className="sm:hidden">Créer</span>
        </Link>
      </div>

      <InvoiceFilters currentStatus={status} currentQ={q} />
      <InvoiceTable invoices={allInvoices ?? []} currentPage={currentPage} totalPages={totalPages} currentStatus={status} currentQ={q} />
    </div>
  );
}
