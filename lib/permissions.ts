import 'server-only';

export type Feature =
  | 'invoices'
  | 'products'
  | 'packs'
  | 'stock'
  | 'payments'
  | 'cash_register'
  | 'supply'
  | 'clients'
  | 'reports'
  | 'settings';

export type PermissionLevel = 'none' | 'read' | 'write';

export type Permissions = Record<Feature, PermissionLevel>;

export const ALL_FEATURES: Feature[] = [
  'invoices', 'products', 'packs', 'stock', 'payments',
  'cash_register', 'supply', 'clients', 'reports', 'settings',
];

export const DEFAULT_ROLES: { name: string; description: string; permissions: Permissions }[] = [
  {
    name: 'Propriétaire',
    description: 'Accès complet à toutes les fonctionnalités',
    permissions: {
      invoices: 'write', products: 'write', packs: 'write', stock: 'write',
      payments: 'write', cash_register: 'write', supply: 'write',
      clients: 'write', reports: 'write', settings: 'write',
    },
  },
  {
    name: 'Gérant',
    description: 'Gestion commerciale complète sans les paramètres',
    permissions: {
      invoices: 'write', products: 'write', packs: 'write', stock: 'write',
      payments: 'write', cash_register: 'write', supply: 'write',
      clients: 'write', reports: 'write', settings: 'none',
    },
  },
  {
    name: 'Caissier',
    description: 'Facturation, encaissements et caisse uniquement',
    permissions: {
      invoices: 'write', products: 'none', packs: 'none', stock: 'read',
      payments: 'write', cash_register: 'read', supply: 'none',
      clients: 'read', reports: 'read', settings: 'none',
    },
  },
  {
    name: 'Magasinier',
    description: 'Gestion des produits, packs, stock et approvisionnement',
    permissions: {
      invoices: 'read', products: 'write', packs: 'write', stock: 'write',
      payments: 'none', cash_register: 'none', supply: 'write',
      clients: 'none', reports: 'read', settings: 'none',
    },
  },
  {
    name: 'Lecteur',
    description: 'Consultation seule de toutes les données',
    permissions: {
      invoices: 'read', products: 'read', packs: 'read', stock: 'read',
      payments: 'read', cash_register: 'read', supply: 'read',
      clients: 'read', reports: 'read', settings: 'none',
    },
  },
];

export class PermissionError extends Error {
  constructor(feature: Feature, level: PermissionLevel) {
    super(`Permission refusée : ${feature} nécessite le niveau ${level}`);
    this.name = 'PermissionError';
  }
}

const LEVEL_ORDER: Record<PermissionLevel, number> = { none: 0, read: 1, write: 2 };

export function hasPermission(
  permissions: Record<string, string> | null | undefined,
  feature: Feature,
  requiredLevel: PermissionLevel,
): boolean {
  if (!permissions) return false;
  const userLevel = (permissions[feature] as PermissionLevel) || 'none';
  return LEVEL_ORDER[userLevel] >= LEVEL_ORDER[requiredLevel];
}

export function canRead(permissions: Record<string, string> | null | undefined, feature: Feature): boolean {
  return hasPermission(permissions, feature, 'read');
}

export function canWrite(permissions: Record<string, string> | null | undefined, feature: Feature): boolean {
  return hasPermission(permissions, feature, 'write');
}

export function assertPermission(
  permissions: Record<string, string> | null | undefined,
  feature: Feature,
  level: PermissionLevel,
): void {
  if (!hasPermission(permissions, feature, level)) {
    throw new PermissionError(feature, level);
  }
}
