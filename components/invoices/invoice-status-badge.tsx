import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
  VALIDATED: { label: 'Validée', className: 'bg-blue-100 text-blue-700' },
  PARTIALLY_PAID: { label: 'Payée (partielle)', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Payée', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
  CONVERTED_TO_CREDIT: { label: 'Convertie en avoir', className: 'bg-purple-100 text-purple-700' },
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={cn(
      'px-2.5 py-0.5 rounded-full text-xs font-medium',
      config.className,
    )}>
      {config.label}
    </span>
  );
}
