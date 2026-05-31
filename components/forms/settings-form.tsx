'use client';

import { useRouter } from 'next/navigation';
import { updateShopSettings, updateInvoiceSettings } from '@/lib/actions/settings';

interface Props {
  shopSettings: any;
  invoiceSettings: any;
}

export function SettingsForm({ shopSettings, invoiceSettings }: Props) {
  const router = useRouter();

  const handleShopSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateShopSettings(new FormData(e.currentTarget));
    router.refresh();
  };

  const handleInvoiceSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updateInvoiceSettings(new FormData(e.currentTarget));
    router.refresh();
  };

  return (
    <>
      <form onSubmit={handleShopSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Boutique</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nom légal</label>
            <input name="legalName" defaultValue={shopSettings?.legal_name} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Nom commercial</label>
            <input name="tradingName" defaultValue={shopSettings?.trading_name || ''} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Adresse</label>
          <input name="address" defaultValue={shopSettings?.address || ''} className="w-full px-3 py-2 border rounded-lg text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
            <input name="email" type="email" defaultValue={shopSettings?.email} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Téléphone</label>
            <input name="phone" defaultValue={shopSettings?.phone} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="+228XXXXXXXX" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Devise</label>
            <select name="currency" defaultValue={shopSettings?.currency || 'XOF'} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="XOF">FCFA (XOF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
              <option value="GBP">Livre (GBP)</option>
              <option value="GNF">Franc guinéen (GNF)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Pays</label>
            <select name="country" defaultValue={shopSettings?.country || 'TG'} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="TG">Togo (+228)</option>
              <option value="BJ">Bénin (+229)</option>
              <option value="GH">Ghana (+233)</option>
              <option value="CI">Côte d'Ivoire (+225)</option>
              <option value="SN">Sénégal (+221)</option>
              <option value="GN">Guinée (+224)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Mentions légales (pied de facture)</label>
          <textarea name="invoiceFooter" defaultValue={shopSettings?.invoice_footer || ''} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800">
            Enregistrer
          </button>
        </div>
      </form>

      <form onSubmit={handleInvoiceSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Configuration facture</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">TVA</p>
              <p className="text-xs text-zinc-500">Activer le calcul de la TVA</p>
            </div>
            <input name="enableTax" type="checkbox" defaultChecked={invoiceSettings?.enable_tax} className="w-4 h-4" />
          </label>

          <div className="ml-6 space-y-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1">Taux TVA (%)</label>
            <input name="taxRate" type="number" step="0.1" min="0" max="100"
              defaultValue={invoiceSettings?.tax_rate ? Number(invoiceSettings.tax_rate) * 100 : 19}
              className="w-32 px-3 py-2 border rounded-lg text-sm"
            />
            <label className="block text-sm font-medium text-zinc-700 mb-1">Libellé TVA</label>
            <input name="taxLabel" defaultValue={invoiceSettings?.tax_label || 'TVA'} className="w-32 px-3 py-2 border rounded-lg text-sm" />
          </div>

          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Rabais par ligne</p>
              <p className="text-xs text-zinc-500">Permet d'ajouter un % de réduction sur chaque article</p>
            </div>
            <input name="enableLineDiscount" type="checkbox" defaultChecked={invoiceSettings?.enable_line_discount} className="w-4 h-4" />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Remise globale</p>
              <p className="text-xs text-zinc-500">Remise en % sur le total (hors TVA)</p>
            </div>
            <input name="enableGlobalDiscount" type="checkbox" defaultChecked={invoiceSettings?.enable_global_discount} className="w-4 h-4" />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Frais de port</p>
              <p className="text-xs text-zinc-500">Ajouter des frais de livraison</p>
            </div>
            <input name="enableShipping" type="checkbox" defaultChecked={invoiceSettings?.enable_shipping} className="w-4 h-4" />
          </label>

          <label className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium text-sm">Arrondi automatique</p>
              <p className="text-xs text-zinc-500">Arrondir le total à la dizaine/centaine</p>
            </div>
            <input name="enableRounding" type="checkbox" defaultChecked={invoiceSettings?.enable_rounding} className="w-4 h-4" />
          </label>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Préfixe facture</label>
            <input name="invoicePrefix" defaultValue={invoiceSettings?.invoice_prefix || 'FACT-'} className="w-32 px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        <button type="submit" className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800">
          Enregistrer
        </button>
      </form>
    </>
  );
}
