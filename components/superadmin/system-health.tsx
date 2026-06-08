import { createAdminClient } from '@/lib/server';
import { Activity } from 'lucide-react';

export async function SystemHealth() {
  const admin = createAdminClient();

  const { count: activeCount } = await admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
  const { count: trialCount } = await admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'TRIAL');
  const { count: pastDueCount } = await admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'PAST_DUE');
  const { count: shopsCount } = await admin.from('shops').select('*', { count: 'exact', head: true });

  const total = shopsCount ?? 0;
  const active = activeCount ?? 0;
  const trials = trialCount ?? 0;
  const issues = pastDueCount ?? 0;
  const healthPct = total > 0 ? Math.round(((active + trials) / total) * 100) : 100;

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700">Santé du système</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${issues === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {issues === 0 ? 'Tout va bien' : `${issues} impayé${issues > 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${healthPct}%`,
            background: healthPct >= 90 ? '#059669' : healthPct >= 70 ? '#d97706' : '#dc2626',
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold font-heading tabular-nums text-zinc-900">{total}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Boutiques</p>
        </div>
        <div>
          <p className="text-lg font-bold font-heading tabular-nums text-emerald-600">{active + trials}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Actifs</p>
        </div>
        <div>
          <p className={`text-lg font-bold font-heading tabular-nums ${issues > 0 ? 'text-red-500' : 'text-zinc-400'}`}>{issues}</p>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Impayés</p>
        </div>
      </div>
    </div>
  );
}
