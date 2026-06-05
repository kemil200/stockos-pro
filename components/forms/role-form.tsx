'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRole, updateRole } from '@/lib/actions/roles';
import { ALL_FEATURES, type Feature, type PermissionLevel, type Permissions } from '@/lib/permissions';
import { Eye, Pencil, Shield } from 'lucide-react';

const FEATURE_LABELS: Record<Feature, string> = {
  invoices: 'Factures',
  products: 'Produits',
  packs: 'Packs',
  stock: 'Stock',
  payments: 'Paiements',
  cash_register: 'Caisse',
  supply: 'Approvisionnement',
  clients: 'Clients',
  reports: 'Rapports',
  settings: 'Paramètres',
};

const LEVELS: { value: PermissionLevel; label: string; icon: typeof Eye }[] = [
  { value: 'none', label: 'Aucun', icon: Eye },
  { value: 'read', label: 'Lecture', icon: Eye },
  { value: 'write', label: 'Écriture', icon: Pencil },
];

const LEVEL_COLORS: Record<PermissionLevel, string> = {
  none: 'bg-zinc-100 text-zinc-500',
  read: 'bg-blue-100 text-blue-700',
  write: 'bg-emerald-100 text-emerald-700',
};

interface Props {
  role?: {
    id: string;
    name: string;
    description: string | null;
    permissions: Permissions | Record<string, string>;
    is_default?: boolean;
  };
}

export function RoleForm({ role }: Props) {
  const router = useRouter();
  const isEditing = !!role;
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [permissions, setPermissions] = useState<Permissions>(
    (role?.permissions && typeof role.permissions === 'object')
      ? {
          invoices: (role.permissions.invoices || 'none') as PermissionLevel,
          products: (role.permissions.products || 'none') as PermissionLevel,
          packs: (role.permissions.packs || 'none') as PermissionLevel,
          stock: (role.permissions.stock || 'none') as PermissionLevel,
          payments: (role.permissions.payments || 'none') as PermissionLevel,
          cash_register: (role.permissions.cash_register || 'none') as PermissionLevel,
          supply: (role.permissions.supply || 'none') as PermissionLevel,
          clients: (role.permissions.clients || 'none') as PermissionLevel,
          reports: (role.permissions.reports || 'none') as PermissionLevel,
          settings: (role.permissions.settings || 'none') as PermissionLevel,
        }
      : {
          invoices: 'none', products: 'none', packs: 'none', stock: 'none',
          payments: 'none', cash_register: 'none', supply: 'none',
          clients: 'none', reports: 'none', settings: 'none',
        },
  );

  const setFeatureLevel = (feature: Feature, level: PermissionLevel) => {
    setPermissions((prev) => ({ ...prev, [feature]: level }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', description);
      fd.append('permissions', JSON.stringify(permissions));

      let result;
      if (isEditing) {
        fd.append('roleId', role!.id);
        result = await updateRole(fd);
      } else {
        result = await createRole(fd);
      }

      if (result.success) {
        router.replace('/settings/roles');
      } else {
        alert(result.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
          {isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}
        </h1>
        <p className="text-sm text-zinc-500 mt-1.5">
          {isEditing ? 'Modifiez les permissions du rôle' : 'Définissez les accès pour ce rôle'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nom du rôle *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            placeholder="Ex: Vendeur"
            required
            disabled={role?.is_default}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none"
            placeholder="Description du rôle"
            disabled={role?.is_default}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6">
        <h2 className="font-heading font-semibold text-base flex items-center gap-2 mb-4">
          <Shield className="size-4 text-zinc-600" />
          Permissions
        </h2>
        <div className="space-y-3">
          {ALL_FEATURES.map((feature) => (
            <div key={feature} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
              <span className="text-sm font-medium text-zinc-700">{FEATURE_LABELS[feature]}</span>
              <div className="flex gap-1">
                {LEVELS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    disabled={role?.is_default}
                    onClick={() => setFeatureLevel(feature, value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                      permissions[feature] === value
                        ? LEVEL_COLORS[value] + ' ring-1 ring-inset ring-current/20'
                        : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'
                    } ${role?.is_default ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!role?.is_default && (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-all shadow-sm"
          >
            {submitting ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer le rôle'}
          </button>
        </div>
      )}
    </form>
  );
}
