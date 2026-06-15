import { formatCurrency } from '@/lib/utils/currency';
import { TrendingUp, TrendingDown, Star, AlertTriangle } from 'lucide-react';

interface StoryProps {
  revenue: number;
  cogs: number;
  profit: number;
  marginPct: number;
  nbSales: number;
  avgBasket: number;
  topProduct: { name: string; revenue: number; quantity: number } | null;
  lowStockCount: number;
  label: string;
}

export function StorySection({ revenue, cogs, profit, marginPct, nbSales, avgBasket, topProduct, lowStockCount, label }: StoryProps) {
  if (nbSales === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6">
        <p className="text-zinc-500">Aucune vente enregistrée sur cette période. Créez votre première facture pour commencer à suivre vos performances.</p>
      </div>
    );
  }

  const isProfitable = profit > 0;
  const marginGood = marginPct >= 20;

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 space-y-5 text-sm leading-relaxed">
      <h2 className="font-heading font-semibold text-base text-zinc-900">Analyse</h2>

      {/* Revenue story */}
      <div className="flex items-start gap-3">
        <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${isProfitable ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {isProfitable ? <TrendingUp className="size-4 text-emerald-600" /> : <TrendingDown className="size-4 text-red-500" />}
        </div>
        <div>
          <p className="text-zinc-800">
            Sur <strong>{label}</strong>, vous avez réalisé <strong className="text-emerald-600">{formatCurrency(revenue)}</strong> de chiffre d&apos;affaires
            avec <strong>{nbSales} vente{nbSales > 1 ? 's' : ''}</strong>.
          </p>
          <p className="text-zinc-500 text-xs mt-1">
            En moyenne, chaque vente rapporte {formatCurrency(avgBasket)}.
          </p>
        </div>
      </div>

      {/* COGS story */}
      {cogs > 0 && (
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
            <TrendingDown className="size-4 text-red-400" />
          </div>
          <div>
            <p className="text-zinc-800">
              Le coût des marchandises vendues est de <strong className="text-red-500">{formatCurrency(cogs)}</strong>.
              {cogs > 0 && revenue > 0 ? (
                <> Cela représente <strong>{((cogs / revenue) * 100).toFixed(0)}%</strong> de votre chiffre d&apos;affaires.</>
              ) : null}
            </p>
            <p className="text-zinc-500 text-xs mt-1">
              Ce montant est calculé à partir du prix d&apos;achat de chaque produit vendu.
            </p>
          </div>
        </div>
      )}

      {/* Profit story */}
      <div className="flex items-start gap-3">
        <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${marginGood ? 'bg-emerald-100' : profit > 0 ? 'bg-amber-100' : 'bg-red-100'}`}>
          <Star className={`size-4 ${marginGood ? 'text-emerald-600' : profit > 0 ? 'text-amber-600' : 'text-red-500'}`} />
        </div>
        <div>
          {isProfitable ? (
            <p className="text-zinc-800">
              Votre <strong>bénéfice brut</strong> est de <strong className="text-emerald-600">{formatCurrency(profit)}</strong>.
              {marginGood ? (
                <> C&apos;est une <strong className="text-emerald-600">bonne performance</strong> : pour chaque 100 FCFA vendus, vous gagnez <strong>{marginPct.toFixed(0)} FCFA</strong> après déduction du coût des produits.</>
              ) : (
                <> Pour chaque 100 FCFA vendus, il vous reste <strong>{marginPct.toFixed(0)} FCFA</strong> après le coût des produits. {marginPct < 10 ? 'Vérifiez vos prix de vente ou négociez vos prix d\'achat.' : ''}</>
              )}
            </p>
          ) : (
            <p className="text-zinc-800">
              Vos ventes ne couvrent pas le coût des produits. <strong className="text-red-500">Perte de {formatCurrency(Math.abs(profit))}</strong>.
              Augmentez vos prix de vente ou réduisez vos coûts d&apos;achat.
            </p>
          )}
        </div>
      </div>

      {/* Top product */}
      {topProduct && (
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Star className="size-4 text-blue-600" />
          </div>
          <div>
            <p className="text-zinc-800">
              Votre <strong>produit star</strong> est <strong className="text-blue-600">{topProduct.name}</strong> : {formatCurrency(topProduct.revenue)} de ventes sur {topProduct.quantity} unité{topProduct.quantity > 1 ? 's' : ''}.
            </p>
          </div>
        </div>
      )}

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="flex items-start gap-3">
          <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="size-4 text-amber-600" />
          </div>
          <div>
            <p className="text-zinc-800">
              <strong className="text-amber-600">{lowStockCount} produit{lowStockCount > 1 ? 's' : ''}</strong> {lowStockCount > 1 ? 'sont' : 'est'} en rupture ou presque. Pensez à vous réapprovisionner.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
