import { z } from 'zod';

export const PermissionLevelSchema = z.enum(['none', 'read', 'write']);

export const PermissionsSchema = z.object({
  invoices: PermissionLevelSchema,
  products: PermissionLevelSchema,
  packs: PermissionLevelSchema,
  stock: PermissionLevelSchema,
  payments: PermissionLevelSchema,
  cash_register: PermissionLevelSchema,
  supply: PermissionLevelSchema,
  clients: PermissionLevelSchema,
  reports: PermissionLevelSchema,
  settings: PermissionLevelSchema,
});

export const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Nom du rôle requis'),
  description: z.string().optional(),
  permissions: PermissionsSchema,
});

export const UpdateRoleSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string().min(1, 'Nom du rôle requis'),
  description: z.string().optional(),
  permissions: PermissionsSchema,
});

export const AssignRoleSchema = z.object({
  userId: z.string().uuid(),
  roleId: z.string().uuid().nullable(),
});
