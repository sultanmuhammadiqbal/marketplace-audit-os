# Architecture

## Tech Stack
- **Framework**: Next.js 16.2 App Router (React)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database & Auth**: Supabase PostgreSQL & Auth
- **Validation**: Zod + React Hook Form
- **Testing**: Vitest + Playwright

## Design Principles
1. **Feature-based Modular Architecture**: Avoid large monolithic files. Group logic by domain/feature (e.g., `src/features/organizations`, `src/features/clients`).
2. **Server-First Approach**: Use Next.js React Server Components by default. Use Client Components (`"use client"`) only for interactive UI elements.
3. **Separation of Concerns**:
   - **UI Components**: Presentational only.
   - **Domain Logic / Server Actions**: Handle mutations.
   - **Database Queries (DAL)**: Data access layer handles fetching.
   - **Validation**: Zod schemas.
4. **Secure Authentication**: Server-side cookie-based authentication via Supabase Auth. No `localStorage`. No client-side exposure of the service role key.
