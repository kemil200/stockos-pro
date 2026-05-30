import Link from 'next/link';
import { InvoiceStatusBadge } from './invoice-status-badge';
import { formatCurrency } from '@/lib/utils/currency';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: string;
  total: string;
  createdAt: Date;
}

export function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
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
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm">{inv.clientName}</td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {formatCurrency(Number(inv.total))}
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-500">
                  {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
