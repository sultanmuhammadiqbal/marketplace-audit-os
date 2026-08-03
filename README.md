# Marketplace Audit OS

Marketplace Audit OS is a multi-tenant B2B SaaS platform for agencies, consultants, brands, and marketplace teams to audit and improve their Shopee and TikTok Shop stores.

This repository represents **Sprint 0: Product Foundation**, providing a robust, highly secure, and production-ready architecture using Next.js 15, Tailwind CSS, shadcn/ui, and Supabase.

---

## 🚀 Getting Started (Local Development)

The following guide will walk you through setting up the project locally. **You must have Docker installed and running** on your local machine, as we use the local Supabase CLI for the database and authentication services.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Running locally)
- [Supabase CLI](https://supabase.com/docs/guides/cli)

### 2. Install Dependencies

Clone the repository and install the Node modules:

```bash
git clone <your-repo-url>
cd marketplace-audit-os
npm install
```

### 3. Initialize & Start Local Supabase

With Docker running, start your local Supabase stack:

```bash
npx supabase start
```

*This command will download the necessary Docker images, start the PostgreSQL database, and spin up the local Supabase Studio (usually at `http://localhost:54323`).*

### 4. Run Database Migrations and Seed Data

To apply the schema, Row-Level Security (RLS) policies, and populate the database with initial mock data:

```bash
npx supabase db reset
```

*(Alternatively, if you are linking to a remote remote project later, you would use `npx supabase link --project-ref <your-ref>` followed by `npx supabase db push`.)*

### 5. Generate TypeScript Types

Generate strict TypeScript definitions based on your active database schema. This guarantees that your Server Actions and UI are perfectly aligned with your database:

```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

### 6. Configure Environment Variables

Create a `.env.local` file in the root of the project:

```bash
cp .env.example .env.local
```

Fill in the variables using the API URL and Anon Key outputted by `npx supabase start`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

### 7. Run the Next.js Development Server

Start the frontend application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

This project incorporates testing at both the unit and end-to-end layers.

### Run Unit Tests (Vitest)

Unit tests run instantly and do not require the database to be running.

```bash
npm run test
```

### Run E2E Tests (Playwright)

End-to-end tests simulate actual user flows (like authentication and tenant isolation). **Make sure your local dev server and Supabase database are running before executing these.**

```bash
npx playwright test
```

To view the HTML report of the test results:

```bash
npx playwright show-report
```

---

## 🏗️ Architecture Notes
Update Vercel
- **Multi-Tenancy**: Tenant isolation is enforced at the database level via PostgreSQL Row-Level Security (RLS). All tenant tables (`clients`, `brands`, `stores`, etc.) have an `organization_id` column.
- **Security Definer Functions**: We use `has_org_role` to check user permissions securely.
- **Server Actions**: All form submissions (creating organizations, clients, brands, stores) utilize React 19 Server Actions paired with `@supabase/ssr` to ensure secure, server-side data mutations.
- **UI System**: Built with `shadcn/ui` and Tailwind CSS, following a strict premium B2B aesthetic.
