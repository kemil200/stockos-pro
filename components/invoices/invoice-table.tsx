import Link from 'next/link';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { formatCurrency } from '@/lib/utils/currency';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoiceRow {
  id: string;
  invoice_number: string;
  client_name: string;
  status: string;
  total: string;
  created_at: string;
}

function buildPageUrl(page: number, currentStatus?: string, currentQ?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (currentStatus) params.set('status', currentStatus);
  if (currentQ) params.set('q', currentQ);
  const qs = params.toString();
  return `/invoices${qs ? `?${qs}` : ''}`;
}

export function InvoiceTable({ invoices, currentPage, totalPages, currentStatus, currentQ }: { invoices: InvoiceRow[]; currentPage: number; totalPages: number; currentStatus?: string; currentQ?: string }) {
  const btnClass = 'inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg hover:bg-zinc-50 transition-colors';

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-zinc-50">
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">N° Facture</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Client</th>
            <th className="text-left px-4 py-3 text-sm font-medium text-zinc-500">Statut</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Total</th>
            <th className="text-right px-4 py-3 text-sm font-medium text-zinc-500">Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-8 text-zinc-400">
                Aucune facture trouvée
              </td>
            </tr>
          ) : (
            invoices.map((inv) => (
              <tr
                key={inv.id}
                className="border-b last:border-0 hover:bg-zinc-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{inv.client_name}</td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(Number(inv.total))}
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-500">
                  {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-zinc-500">
            Page {currentPage} / {totalPages}
          </span>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link href={buildPageUrl(currentPage - 1, currentStatus, currentQ)} className={btnClass}>
                <ChevronLeft className="size-4" /> Précédent
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildPageUrl(currentPage + 1, currentStatus, currentQ)} className={btnClass}>
                Suivant <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
