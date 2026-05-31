'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Eye, EyeOff, Trash2, Check, X, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  updateSubscription, renewSubscription, toggleReadOnly, deleteShop,
} from '@/lib/actions/superadmin';
import { Button } from '@/components/ui/button';

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'Essai',
  MONTHLY: 'Mensuel',
  ANNUAL: 'Annuel',
};

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

  const features = (sub?.features ?? {}) as Record<string, unknown>;
  const readOnly = !!features.readOnly;

  const doAction = (action: string) => {
    startTransition(async () => {
      try {
        switch (action) {
          case 'to_active':
            await updateSubscription(shop.id, { status: 'ACTIVE', plan: 'MONTHLY' });
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
        }
        setShowConfirm(null);
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    });
  };

  const statusStr = sub ? STATUS_LABELS[sub.status] ?? sub.status : '—';

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
      <td className="px-4 py-3.5">
        <span className="text-sm font-medium text-zinc-900">
          {sub ? (PLAN_LABELS[sub.plan] ?? sub.plan) : '—'}
        </span>
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
            <Button
              size="xs"
              variant="ghost"
              onClick={() => doAction('delete')}
              disabled={isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Check className="size-3" />
            </Button>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setShowConfirm(null)}
              className="text-zinc-500"
            >
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
                <Button size="xs" variant="ghost" onClick={() => doAction('renew_12')} disabled={isPending} title="+12 mois (annuel)">
                  <span className="text-[10px] font-bold text-violet-600">+12m</span>
                </Button>
              </>
            )}

            {sub && (
              <Button size="xs" variant="ghost" onClick={() => doAction('toggle_readonly')} disabled={isPending} title={readOnly ? 'Autoriser écriture' : 'Lecture seule'}>
                {readOnly
                  ? <EyeOff className="size-3.5 text-red-500" />
                  : <Eye className="size-3.5 text-zinc-400" />
                }
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
