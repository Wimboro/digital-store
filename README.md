# Digital Store

One-page digital goods storefront with instant checkout, secure download links, and an authenticated admin console for managing orders, products, and operational settings. This project follows the "Digital Goods One-Page Store + Admin" PRD.

## Stack

- **Framework:** Next.js 15 App Router, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui, Geist font
- **Auth:** NextAuth.js (credentials)
- **ORM/DB:** Prisma + SQLite (file-based, easily swap to other drivers)
- **State & Forms:** React Hook Form, Zod, TanStack Query
- **Email:** Resend or SMTP (optional via env)

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables**
   - Copy `.env.example` to `.env` and adjust values (set `NEXTAUTH_SECRET`, update store identity, etc.).
   - `DATABASE_URL` defaults to `file:./dev.db`, which lives inside the `prisma` directory.

3. **Initialize the database**
   - Apply the schema to SQLite using the provided migration SQL:
     ```bash
     mkdir -p prisma
     sqlite3 prisma/dev.db < prisma/migrations/0001_init/migration.sql
     ```
   - Seed demo data (admin user + sample products):
     ```bash
     npm run db:seed
     ```
     > Default admin credentials: `admin@demo.test` / `Admin123!`

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) to explore the storefront. Admin routes live under `/admin` and require sign-in.

## Available Scripts

| Command            | Description                                         |
| ------------------ | --------------------------------------------------- |
| `npm run dev`      | Start local development server                      |
| `npm run build`    | Build for production                                |
| `npm run start`    | Start the production server                         |
| `npm run lint`     | Run ESLint                                          |
| `npm run db:seed`  | Seed database with demo admin and products          |

## Key Directories

```
src/
  app/
    (storefront, success page, auth, admin dashboards, API routes)
  components/
    admin/         // Admin UI widgets and forms
    storefront/    // Storefront interactions (grid, checkout, etc.)
    ui/            // shadcn/ui primitives
  lib/
    auth.ts        // NextAuth configuration
    prisma.ts      // Prisma client helper
    payments.ts    // Webhook + token helpers
    serializers.ts // Normalize DB payloads for UI/API
prisma/
  migrations/      // SQL schema for SQLite
  seed.ts          // Demo data seeding script
```

## Features Snapshot

- **Storefront**: search & tag filters, markdown product detail modal, checkout sheet integrated with active gateway configuration.
- **Checkout Flow**: creates orders, returns gateway instructions or redirect URLs (Stripe / Midtrans / Xendit / Duitku / Manual QRIS / Auto QRIS), issues download tokens on successful payment.
- **Secure Downloads**: `/api/download/:token` enforces expiry & quota, and redirects to storage URLs.
- **Admin Console**: dashboard metrics, order table + detail view (manual status updates & email resend), product CRUD (with file pointers), settings management for payment/storage/policies.
- **Webhooks**: Stripe, Midtrans, Xendit, and Duitku handlers map gateway payloads to unified order updates. Auto QRIS polling endpoint verifies payments against detected push notifications.

## Testing & QA Notes

- Run `npm run lint` before committing changes.
- The project ships with sample products and an admin user via the seed script to accelerate manual QA.
- Webhook endpoints expect verified signatures in production. Current implementation focuses on payload handling; plug in verification when wiring to live gateways.

## Deployment Tips

- Swap `DATABASE_URL` to your production database (SQLite, Postgres, etc.) and re-run migrations.
- Configure environment variables for the selected payment gateway, object storage, and email provider. For Duitku supply `DUITKU_MERCHANT_CODE` / `DUITKU_API_KEY` (and optionally `DUITKU_BASE_URL`). For Auto QRIS set `AUTOQRIS_WORKER_URL`, `AUTOQRIS_API_KEY`, `AUTOQRIS_STATIC_QRIS`, and `AUTOQRIS_CALLBACK_URL` (optional) before enabling in the admin settings.
- `next.config.ts` sets `images.unoptimized = true` to support arbitrary remote assets (QR codes, marketing images). Adjust as needed for production CDN setups.
- Remember to update `APP_BASE_URL` to the deployed origin so receipt emails contain valid download links.
