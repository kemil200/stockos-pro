import { CashJournalStats } from '@/components/quick-sale/cash-journal-stats';
import { CashJournalForm } from '@/components/quick-sale/cash-journal-form';
import { CashJournalList } from '@/components/quick-sale/cash-journal-list';

export default async function ModeSimplePage() {
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-heading font-semibold text-zinc-900 capitalize">
          {today}
        </h1>
      </div>

      <CashJournalStats />

      <CashJournalForm />

      <CashJournalList />
    </div>
  );
}
