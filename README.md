# StockOS Pro

> SaaS de gestion commerciale et de stock pour PME — Afrique de l'Ouest

ERP/SaaS multi-tenant couvrant la facturation, le stock, la caisse et les abonnements. Conçu pour les PME togolaises, béninoises, ivoiriennes, sénégalaises et guinéennes. Multi-devises (FCFA/XOF, EUR, USD, GBP, GNF).

---

## Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Framework | Next.js (App Router) | 16.x |
| UI | Tailwind CSS + shadcn/ui | v4 |
| Langage | TypeScript | 5.x |
| Auth | Supabase Auth (SSR) | — |
| Base de données | Supabase PostgreSQL | — |
| ORM | Drizzle ORM | 0.45 |
| Déploiement | Vercel | — |
| Formulaires | React Hook Form + Zod | — |

---

## Setup local

```bash
# 1. Cloner le dépôt
git clone <repo-url>
cd stockos-pro

# 2. Installer les dépendances
npm install

# 3. Copier et remplir les variables d'environnement
cp .env.example .env.local

# 4. Push le schéma Drizzle vers la base de données
npx drizzle-kit push

# 5. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `NEXT_PUBLIC_APP_URL` | URL de l'application (ex: http://localhost:3000) | Oui |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Oui |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé anon/publishable Supabase | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service_role Supabase (server-only) | Oui |
| `SUPABASE_DB_URL` | URL de connexion PostgreSQL directe (pour Drizzle) | Oui |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob (logos, PDFs) | Non |
| `CRON_SECRET` | Secret pour les cron jobs Vercel | Non |

---

## Structure des dossiers

```
stockos-pro/
├── app/                    # Pages Next.js (App Router)
│   ├── (auth)/             # Pages publiques (sign-in, sign-up)
│   ├── (dashboard)/        # Pages privées (invoices, products, stock, etc.)
│   │   ├── invoices/       # Gestion des factures
│   │   ├── products/       # Catalogue produits
│   │   ├── stock/          # État des stocks
│   │   ├── payments/       # Encaissements
│   │   ├── cash-register/  # Journal de caisse
│   │   ├── supply/         # Approvisionnement
│   │   ├── clients/        # Gestion clients
│   │   ├── settings/       # Paramètres boutique
│   │   └── reports/        # Rapports et statistiques
│   ├── api/                # API routes (webhooks, setup)
│   └── superadmin/         # Interface superadmin
├── components/             # Composants React (shadcn/ui, métier)
├── lib/
│   ├── actions/            # Server Actions (invoices, payments, products, stock)
│   ├── db/
│   │   ├── schema/         # Schémas Drizzle (tables PostgreSQL)
│   │   └── migrations/     # Fichiers de migration SQL
│   ├── services/           # Logique métier pure (calcul facture, stock, event bus)
│   ├── validations/        # Schémas Zod (invoice, product)
│   └── utils/              # Utilitaires (devises, numéros, téléphone)
├── hooks/                  # Hooks React personnalisés
├── scripts/                # Scripts CLI (création superadmin)
└── public/                 # Assets statiques
```

---

## Commandes Drizzle

```bash
# Générer les migrations à partir du schéma
npx drizzle-kit generate

# Appliquer les migrations
npx drizzle-kit migrate

# Pousser le schéma directement (dev uniquement)
npx drizzle-kit push

# Ouvrir Drizzle Studio (interface visuelle)
npx drizzle-kit studio
```

---

## Déploiement

Déployé sur [Vercel](https://vercel.com). La branche `main` déclenche un déploiement automatique en production.

```bash
npm run build   # Build de production
npm run start   # Serveur de production
```

---

## Licence

Propriétaire — Tous droits réservés.
