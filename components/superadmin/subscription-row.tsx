'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Eye, EyeOff, Trash2, Check, X, Ban, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  updateSubscription, renewSubscription, setPlan, toggleReadOnly, deleteShop,
} from '@/lib/actions/superadmin';
import { Button } from '@/components/ui/button';

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Essai',
  ESSENTIAL: 'Essential',
  STARTER: 'Starter',
  BUSINESS: 'Business',
  MONTHLY: 'Mensuel',
  ANNUAL: 'Annuel',
};

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  STARTER: { monthly: 5000, annual: 55000 },
  ESSENTIAL: { monthly: 8500, annual: 90000 },
  BUSINESS: { monthly: 13000, annual: 120000 },
};

const PLANS = ['STARTER', 'ESSENTIAL', 'BUSINESS'];

const STATUS_STYLES: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PAST_DUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-zinc-100 text-zinc-500',
  EXPIRED: 'bg-zinc-100 text-zinc-500',
};

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Essai',
  ACTIVE: 'Actif',
  PAST_DUE: 'Impayé',
  CANCELLED: 'Annulé',
  EXPIRED: 'Expiré',
};

export function SubscriptionRow({
  shop,
  sub,
}: {
  shop: any;
  sub: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [planOpen, setPlanOpen] = useState(false);

  const features = (sub?.features ?? {}) as Record<string, unknown>;
  const readOnly = !!features.readOnly;
  const currentPlan = sub?.plan || 'TRIAL';

  const doAction = (action: string) => {
    startTransition(async () => {
      try {
        switch (action) {
          case 'to_active':
            await updateSubscription(shop.id, { status: 'ACTIVE', plan: currentPlan === 'TRIAL' ? 'ESSENTIAL' : currentPlan });
            break;
          case 'to_past_due':
            await updateSubscription(shop.id, { status: 'PAST_DUE' });
            break;
          case 'to_cancelled':
            await updateSubscription(shop.id, { status: 'CANCELLED' });
            break;
          case 'renew_1':
            await renewSubscription(shop.id, 1);
            break;
          case 'renew_12':
            await renewSubscription(shop.id, 12);
            break;
          case 'toggle_readonly':
            await toggleReadOnly(shop.id, !readOnly);
            break;
          case 'delete':
            await deleteShop(shop.id);
            break;
          default:
            if (action.startsWith('plan_')) {
              const plan = action.replace('plan_', '');
              await setPlan(shop.id, plan, 12);
            } else if (action.startsWith('plan_monthly_')) {
              const plan = action.replace('plan_monthly_', '');
              await setPlan(shop.id, plan, 1);
            }
        }
        setShowConfirm(null);
        setPlanOpen(false);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  };

  const statusStr = sub ? STATUS_LABELS[sub.status] ?? sub.status : '—';
  const priceInfo = PLAN_PRICES[currentPlan];
  const planLabel = PLAN_LABELS[currentPlan] ?? currentPlan;

  return (
    <tr className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
      <td className="px-4 py-3.5">
        <div className="font-medium text-zinc-900">{shop.name}</div>
        <div className="text-xs text-zinc-400 mt-0.5 font-mono">{shop.slug}</div>
      </td>
      <td className="px-4 py-3.5">
        {shop.shop_settings?.[0] ? (
          <div>
            <div className="text-sm text-zinc-600">{shop.shop_settings[0].email}</div>
            <div className="text-xs text-zinc-400">{shop.shop_settings[0].phone}</div>
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 relative">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            currentPlan === 'BUSINESS' ? 'bg-violet-100 text-violet-700' :
            currentPlan === 'ESSENTIAL' ? 'bg-emerald-100 text-emerald-700' :
            currentPlan === 'STARTER' ? 'bg-blue-100 text-blue-700' :
            'bg-zinc-100 text-zinc-600'
          }`}>
            {planLabel}
          </span>
          {sub && (sub.status === 'ACTIVE' || sub.status === 'TRIAL') && (
            <button
              onClick={() => setPlanOpen(!planOpen)}
              className="p-0.5 hover:bg-zinc-200 rounded transition-colors"
            >
              <ChevronDown className="size-3 text-zinc-400" />
            </button>
          )}
        </div>
        {priceInfo && (
          <div className="text-[10px] text-zinc-400 mt-1">
            {new Intl.NumberFormat('fr-FR').format(priceInfo.annual)} FCFA/an
          </div>
        )}

        {planOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setPlanOpen(false)} />
            <div className="absolute z-50 left-0 top-full mt-1 w-48 bg-white rounded-xl border shadow-lg py-1 text-sm">
              <p className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase">Changer de plan</p>
              {PLANS.map((p) => (
                <div key={p} className="border-t">
                  <button
                    onClick={() => doAction(`plan_${p}`)}
                    disabled={isPending || currentPlan === p}
                    className={`w-full text-left px-3 py-2 hover:bg-zinc-50 transition-colors flex justify-between items-center ${
                      currentPlan === p ? 'text-emerald-600 font-medium' : 'text-zinc-700'
                    }`}
                  >
                    <span>{PLAN_LABELS[p]}</span>
                    <span className="text-[10px] text-zinc-400">
                      {new Intl.NumberFormat('fr-FR').format(PLAN_PRICES[p].annual)}/an
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </td>
      <td className="px-4 py-3.5">
        {sub ? (
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold',
              STATUS_STYLES[sub.status] ?? 'bg-zinc-100 text-zinc-600',
            )}>
              {statusStr}
            </span>
            {readOnly && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                <EyeOff className="size-2.5" /> RO
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-zinc-400">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-sm text-zinc-500 whitespace-nowrap">
        {sub?.current_period_end
          ? new Date(sub.current_period_end).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'short', year: 'numeric',
            })
          : '—'}
      </td>
      <td className="px-4 py-3.5 text-right">
        {showConfirm === shop.id ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-[11px] text-zinc-500 mr-1">Confirmer ?</span>
            <Button size="xs" variant="ghost" onClick={() => doAction('delete')} disabled={isPending} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Check className="size-3" />
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowConfirm(null)} className="text-zinc-500">
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {sub?.status === 'TRIAL' && (
              <Button size="xs" variant="ghost" onClick={() => doAction('to_active')} disabled={isPending} title="Activer">
                <Check className="size-3.5 text-emerald-600" />
              </Button>
            )}
            {sub?.status === 'ACTIVE' && (
              <Button size="xs" variant="ghost" onClick={() => doAction('to_past_due')} disabled={isPending} title="Marquer impayé">
                <Ban className="size-3.5 text-amber-600" />
              </Button>
            )}
            {(sub?.status === 'PAST_DUE' || sub?.status === 'CANCELLED' || sub?.status === 'EXPIRED') && (
              <Button size="xs" variant="ghost" onClick={() => doAction('to_active')} disabled={isPending} title="Réactiver">
                <RefreshCw className="size-3.5 text-emerald-600" />
              </Button>
            )}

            {sub && sub.status !== 'CANCELLED' && sub.status !== 'EXPIRED' && (
              <>
                <Button size="xs" variant="ghost" onClick={() => doAction('renew_1')} disabled={isPending} title="+1 mois">
                  <span className="text-[10px] font-bold text-blue-600">+1m</span>
                </Button>
                <Button size="xs" variant="ghost" onClick={() => doAction('renew_12')} disabled={isPending} title="+12 mois">
                  <span className="text-[10px] font-bold text-violet-600">+12m</span>
                </Button>
              </>
            )}

            {sub && (
              <Button size="xs" variant="ghost" onClick={() => doAction('toggle_readonly')} disabled={isPending} title={readOnly ? 'Autoriser écriture' : 'Lecture seule'}>
                {readOnly ? <EyeOff className="size-3.5 text-red-500" /> : <Eye className="size-3.5 text-zinc-400" />}
              </Button>
            )}

            <Button size="xs" variant="ghost" onClick={() => setShowConfirm(shop.id)} disabled={isPending} title="Supprimer" className="text-zinc-300 hover:text-red-500">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}
